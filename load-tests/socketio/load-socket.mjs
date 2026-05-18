/**
 * 100 parallel Socket.IO clients via API gateway — cookie auth + websocket-only (same as prod client).
 * Artillery's Socket.IO engine does not apply extraHeaders when transport is websocket-only; Node client does.
 *
 * Env: LOAD_TEST_BASE_URL (default http://localhost:3000), LOAD_TEST_CLIENTS (default 100),
 *      optional LOAD_TEST_DURATION_SEC hold-open time after scenarios finish (default 0).
 *
 * Run from repo: cd load-tests && npm install && npm run socket:load
 * Loads optional `load-tests/.env` if present.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { io as ioc } from 'socket.io-client';
import axios from 'axios';

import { makeLoadTestUsername } from '../scripts/loadtest-username.mjs';

const loadTestsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(loadTestsRoot, '.env') });

const baseUrl = (process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const api = `${baseUrl}/api`;
const clientCount = Math.max(1, Number(process.env.LOAD_TEST_CLIENTS || 100));
const holdSec = Math.max(0, Number(process.env.LOAD_TEST_DURATION_SEC || 0));

function percentile(sorted, p) {
  if (!sorted.length) {
    return 0;
  }
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function registerLogin(index) {
  const username = makeLoadTestUsername('s', index);
  const email = `${username}@example.com`;
  const password = 'Password123!';

  await axios.post(`${api}/auth/register`, {
    username,
    email,
    password,
    repeatPassword: password,
  });

  const login = await axios.post(`${api}/auth/login`, { email, password });
  const setCookie = login.headers['set-cookie'];
  const accessLine = Array.isArray(setCookie)
    ? setCookie.find((c) => c.startsWith('access_token='))
    : String(setCookie || '');
  const accessCookie = accessLine ? accessLine.split(';')[0] : null;
  if (!accessCookie) {
    throw new Error(`No access_token cookie for ${email}`);
  }

  const userId = login.data.id;

  const ch = await axios.post(
    `${api}/channels/create`,
    {
      channelName: `sock_${index}_${Date.now().toString(36)}`,
      memberIds: [userId],
    },
    { headers: { Cookie: accessCookie } },
  );

  return {
    username,
    userId,
    accessCookie,
    channelId: ch.data.channelId,
  };
}

function connectClient(ctx) {
  return new Promise((resolve) => {
    const deliverLatencies = [];
    let connected = false;
    let settled = false;

    const finish = (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      resolve(payload);
    };

    const socket = ioc(baseUrl, {
      path: '/api/socket.io',
      transports: ['websocket'],
      extraHeaders: { Cookie: ctx.accessCookie },
      reconnection: false,
      timeout: 30_000,
    });

    setTimeout(() => {
      if (!settled) {
        finish({
          connected,
          deliverLatencies,
          username: ctx.username,
          error: 'overall_timeout',
        });
      }
    }, 25_000);

    socket.on('connect', () => {
      connected = true;
      socket.emit('join_all_user_channels', { channelIds: [ctx.channelId] });

      const t0 = Date.now();
      const content = `lt|${t0}|${ctx.username}`;

      setTimeout(() => {
        socket.once('new_message', (payload) => {
          const c = payload?.content;
          if (typeof c === 'string' && c.startsWith(`lt|${t0}|`)) {
            deliverLatencies.push(Date.now() - t0);
          }
        });

        socket.emit('send_message', {
          channelId: ctx.channelId,
          senderUsername: ctx.username,
          content,
          sentAt: new Date().toISOString(),
        });
      }, 400);

      setTimeout(() => {
        finish({
          connected,
          deliverLatencies,
          username: ctx.username,
          error: null,
        });
      }, 12_000);
    });

    socket.on('connect_error', (err) => {
      finish({
        connected,
        deliverLatencies,
        username: ctx.username,
        error: `connect_error: ${err?.message || err}`,
      });
    });

    socket.on('error', (err) => {
      finish({
        connected,
        deliverLatencies,
        username: ctx.username,
        error: `socket error: ${err?.message || err}`,
      });
    });
  });
}

const users = [];
console.log(`Provisioning ${clientCount} users + channels...`);
for (let i = 0; i < clientCount; i++) {
  users.push(await registerLogin(i));
}

console.log('Connecting sockets and sending one message each...');
const results = await Promise.all(users.map((u) => connectClient(u)));

const errors = results.filter((r) => r.error);
if (errors.length) {
  console.log('\nFirst errors (up to 5):');
  errors.slice(0, 5).forEach((e) => console.log(`  ${e.username}: ${e.error}`));
}

const connected = results.filter((r) => r.connected).length;
const connRate = connected / clientCount;
const allLat = results.flatMap((r) => r.deliverLatencies);
allLat.sort((a, b) => a - b);
const missingEcho = results.filter((r) => r.connected && r.deliverLatencies.length === 0).length;

console.log('\n--- Socket.IO load summary ---');
console.log(`clients:              ${clientCount}`);
console.log(`connected:            ${connected} (${(connRate * 100).toFixed(2)}%)`);
console.log(`delivery samples:     ${allLat.length} (connected but no echo: ${missingEcho})`);
if (allLat.length) {
  const avg = allLat.reduce((a, b) => a + b, 0) / allLat.length;
  console.log(
    `delivery latency ms — p50 ${percentile(allLat, 50).toFixed(0)}, p95 ${percentile(allLat, 95).toFixed(0)}, p99 ${percentile(allLat, 99).toFixed(0)}, mean ${avg.toFixed(0)}`,
  );
}

console.log(`\nCV thresholds: websocket stability > 99% → ${connRate >= 0.99 ? 'PASS' : 'FAIL'}`);
if (holdSec > 0) {
  console.log(`Holding ${holdSec}s for manual inspection...`);
  await new Promise((r) => setTimeout(r, holdSec * 1000));
}

if (connRate < 0.99) {
  process.exitCode = 1;
}
