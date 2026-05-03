import type { InternalAxiosRequestConfig } from "axios";

export type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/** Promise pair for requests that must wait until the in-flight refresh finishes. */
export type RefreshWaiter = {
  resolve: () => void;
  reject: (reason: unknown) => void;
};
