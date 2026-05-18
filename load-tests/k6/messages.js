import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getApiGatewayBaseUrl, resolveMessagingFixture } from './lib.js';

/**
 * POST /api/messages — targets messaging accept latency (~Kafka enqueue + HTTP hop).
 *
 * Env: LOAD_TEST_BASE_URL, optional LOAD_TEST_EMAIL / LOAD_TEST_PASSWORD / LOAD_TEST_CHANNEL_ID
 *      (if channel id omitted, setup() registers a new user + channel once per test run).
 *
 * Rate: LOAD_TEST_MSG_RATE (default 100), LOAD_TEST_MSG_DURATION (default 2m).
 * Throttling: increase GATEWAY_THROTTLE_LIMIT on api-gateway for RPS > ~3/s sustained.
 */

const msgErrorRate = new Rate('message_publish_errors');
const msgDuration = new Trend('message_publish_duration_ms');

export const options = {
  scenarios: {
    publish: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LOAD_TEST_MSG_RATE || 100),
      timeUnit: '1s',
      duration: __ENV.LOAD_TEST_MSG_DURATION || '2m',
      preAllocatedVUs: Number(__ENV.LOAD_TEST_MSG_PRE_VUS || 80),
      maxVUs: Number(__ENV.LOAD_TEST_MSG_MAX_VUS || 250),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    message_publish_errors: ['rate<0.01'],
  },
};

const baseUrl = getApiGatewayBaseUrl();

export function setup() {
  const fixture = resolveMessagingFixture(baseUrl);
  if (!fixture.ok || !fixture.accessCookie || !fixture.channelId || !fixture.userId) {
    throw new Error(
      'messages setup failed: set LOAD_TEST_EMAIL, LOAD_TEST_PASSWORD, LOAD_TEST_CHANNEL_ID or allow auto fixture',
    );
  }
  return {
    accessCookie: fixture.accessCookie,
    channelId: fixture.channelId,
    userId: fixture.userId,
    username: fixture.username || `user-${fixture.userId.slice(0, 8)}`,
  };
}

export default function (data) {
  const payload = JSON.stringify({
    channelId: data.channelId,
    senderUsername: data.username,
    content: `k6-${Date.now()}-${__VU}-${__ITER}`,
    sentAt: new Date().toISOString(),
  });
  const start = Date.now();
  const res = http.post(`${baseUrl}/api/messages`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: data.accessCookie,
    },
  });
  msgDuration.add(Date.now() - start);
  const ok = check(res, {
    'accepted': (r) => r.status === 202 || r.status === 200,
  });
  msgErrorRate.add(!ok);
  sleep(0.01);
}
