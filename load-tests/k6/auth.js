import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { getApiGatewayBaseUrl, postLoginAndGetAccessCookie } from "./lib.js";

/**
 * Auth flow: POST /api/auth/login under concurrency.
 *
 * Env: LOAD_TEST_BASE_URL, LOAD_TEST_EMAIL, LOAD_TEST_PASSWORD
 *
 * Thresholds (tune for where you run):
 * - LOAD_TEST_AUTH_P95_MS — p95 latency cap on http_req_duration (default 30000). Local Docker +
 *   50 VUs often lands ~10–25s with tail spikes; tighten (e.g. 2000) only on scaled staging/CI.
 * - LOAD_TEST_AUTH_FAIL_RATE_MAX / LOAD_TEST_AUTH_CHECK_FAIL_RATE_MAX — max failure rates (default 0.01 = 1%).
 *
 * Before high traffic: raise api-gateway GATEWAY_THROTTLE_LIMIT (default 200/min blocks bursts).
 */

const authP95Ms = Number(__ENV.LOAD_TEST_AUTH_P95_MS || 30_000);
const httpFailMax = __ENV.LOAD_TEST_AUTH_FAIL_RATE_MAX || "0.01";
const authCheckFailMax = __ENV.LOAD_TEST_AUTH_CHECK_FAIL_RATE_MAX || "0.01";

const errorRate = new Rate("auth_errors");
const loginDuration = new Trend("auth_login_duration");

export const options = {
  scenarios: {
    auth_burst: {
      executor: "constant-vus",
      vus: Number(__ENV.LOAD_TEST_AUTH_VUS || 50),
      duration: __ENV.LOAD_TEST_AUTH_DURATION || "2m",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${httpFailMax}`],
    http_req_duration: [`p(95)<${authP95Ms}`],
    auth_errors: [`rate<${authCheckFailMax}`],
  },
};

const baseUrl = getApiGatewayBaseUrl();
const email = __ENV.LOAD_TEST_EMAIL || "";
const password = __ENV.LOAD_TEST_PASSWORD || "";

export function setup() {
  if (!email || !password) {
    throw new Error(
      "Set LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD (run: npm run prepare:fixture)",
    );
  }

  const probe = postLoginAndGetAccessCookie(baseUrl, email, password);

  if (!probe.ok || probe.response.status !== 200) {
    const body = String(probe.response.body || "").slice(0, 400);

    throw new Error(
      `Login probe failed (${probe.response.status}) at ${baseUrl}/api/auth/login.\n` +
        `Body: ${body || "(empty)"}\n` +
        `→ Start the stack from repo root: npm run docker:stack:up\n` +
        `→ Then: npm run prepare:fixture --prefix load-tests\n`,
    );
  }
  return { baseUrl, email, password };
}

export default function (data) {
  const start = Date.now();

  const { ok, response } = postLoginAndGetAccessCookie(
    data.baseUrl,
    data.email,
    data.password,
  );

  loginDuration.add(Date.now() - start);

  const passed = check(response, {
    "status 200": (r) => r.status === 200,
    "has user id": (r) => r.json("id") !== undefined,
  });

  errorRate.add(!passed || !ok);

  sleep(0.3);
}
