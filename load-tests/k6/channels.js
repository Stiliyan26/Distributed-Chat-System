import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getApiGatewayBaseUrl, postLoginAndGetAccessCookie } from './lib.js';

/**
 * GET /api/channels/user under concurrency (JWT via access_token cookie).
 */

const errorRate = new Rate('channels_errors');
const reqDuration = new Trend('channels_duration_ms');

export const options = {
  scenarios: {
    channels: {
      executor: 'constant-vus',
      vus: Number(__ENV.LOAD_TEST_CHANNELS_VUS || 50),
      duration: __ENV.LOAD_TEST_CHANNELS_DURATION || '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    channels_errors: ['rate<0.01'],
  },
};

const baseUrl = getApiGatewayBaseUrl();
const email = __ENV.LOAD_TEST_EMAIL || '';
const password = __ENV.LOAD_TEST_PASSWORD || '';

export function setup() {
  if (!email || !password) {
    throw new Error('Set LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD');
  }
  const auth = postLoginAndGetAccessCookie(baseUrl, email, password);
  if (!auth.ok || !auth.accessCookie || auth.response.status !== 200) {
    const body = String(auth.response.body || '').slice(0, 400);
    throw new Error(
      `channels setup: login failed (status ${auth.response.status}). ${body}\n` +
        `→ npm run docker:stack:up (repo root), then npm run prepare:fixture`,
    );
  }
  return { baseUrl, accessCookie: auth.accessCookie };
}

export default function (data) {
  const start = Date.now();
  const res = http.get(`${data.baseUrl}/api/channels/user`, {
    headers: { Cookie: data.accessCookie },
  });
  reqDuration.add(Date.now() - start);
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'array body': (r) => Array.isArray(r.json()),
  });
  errorRate.add(!ok);
  sleep(0.2);
}
