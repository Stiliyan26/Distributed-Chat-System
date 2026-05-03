import type { RefreshWaiter } from "./axios.types";

/**
 * Ensures only one `/auth/refresh` runs at a time; other 401s wait, then retry their request.
 * State lives here so the axios interceptor stays a short branching story.
 */
export class SessionRefreshCoordinator {
  #refreshRunning = false;
  #waiters: RefreshWaiter[] = [];

  get refreshRunning(): boolean {
    return this.#refreshRunning;
  }

  startRefresh(): void {
    this.#refreshRunning = true;
  }

  finishRefresh(): void {
    this.#refreshRunning = false;
  }

  /** Resolved after the in-flight refresh succeeds; rejected if it fails. */
  waitForInFlightRefresh(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#waiters.push({ resolve, reject });
    });
  }

  /** Wake everyone waiting on `waitForInFlightRefresh`. Pass an error if refresh failed. */
  settleWaiters(error: unknown | null): void {
    for (const waiter of this.#waiters) {
      if (error != null) {
        waiter.reject(error);
      } else {
        waiter.resolve();
      }
    }
    this.#waiters = [];
  }
}
