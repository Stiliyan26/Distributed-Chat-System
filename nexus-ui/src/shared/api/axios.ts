import axios, { type AxiosError } from "axios";

import { ROUTES } from "@/shared/constants/routes";

import { AuthApiPaths } from "./auth-paths";
import type { RetriableRequestConfig } from "./axios.types";
import { SessionRefreshCoordinator } from "./session-refresh-coordinator";

const axiosClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const sessionRefresh = new SessionRefreshCoordinator();

/** 401 on these must not trigger refresh (unauthenticated or would recurse). */
const AUTH_PATHS_WITHOUT_REFRESH_RETRY = Object.values(AuthApiPaths);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const failedRequestConfig = error.config as RetriableRequestConfig | undefined;

    if (!failedRequestConfig) {
      return Promise.reject(error);
    }

    if (!shouldAttemptTokenRefresh(error, failedRequestConfig)) {
      return Promise.reject(error);
    }

    if (sessionRefresh.refreshRunning) {
      try {
        return await retryAfterInFlightRefresh(failedRequestConfig);
      } catch (waiterError: unknown) {
        return Promise.reject(waiterError);
      }
    }

    try {
      return await runRefreshThenRetryOriginal(failedRequestConfig);
    } catch (refreshError: unknown) {
      return Promise.reject(refreshError);
    }
  },
);

function shouldAttemptTokenRefresh(
  error: AxiosError,
  config: RetriableRequestConfig,
): boolean {
  const isUnauthorized = error.response?.status === 401;
  const isFirstAttempt = !config._retry;

  return (
    isUnauthorized &&
    isFirstAttempt &&
    !urlWouldCauseRefreshLoop(config.url)
  );
}

function urlWouldCauseRefreshLoop(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return AUTH_PATHS_WITHOUT_REFRESH_RETRY.some((segment) => url.includes(segment));
}

async function retryAfterInFlightRefresh(failedRequestConfig: RetriableRequestConfig) {
  await sessionRefresh.waitForInFlightRefresh();
  return axiosClient(failedRequestConfig);
}

async function runRefreshThenRetryOriginal(failedRequestConfig: RetriableRequestConfig) {
  failedRequestConfig._retry = true;
  sessionRefresh.startRefresh();

  try {
    await axiosClient.post(AuthApiPaths.REFRESH);
    sessionRefresh.settleWaiters(null);

    return axiosClient(failedRequestConfig);
  } catch (refreshError: unknown) {
    sessionRefresh.settleWaiters(refreshError);
    window.location.href = ROUTES.login;

    throw refreshError;
  } finally {
    sessionRefresh.finishRefresh();
  }
}

export default axiosClient;
