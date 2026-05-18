/**
 * Option A — group fan-out: N channels, M members each, one broadcast per channel.
 * Every member must receive the same `new_message` (including the sender's socket).
 *
 * Env:
 *   LOAD_TEST_BASE_URL
 *   LOAD_TEST_CHANNEL_COUNT (default 5) — use 20 for diploma demo if the machine can handle it
 *   LOAD_TEST_MEMBERS_PER_CHANNEL (default 20) — 50–100 for large demos
 *   LOAD_TEST_BROADCAST_WAIT_MS (default 25000) — time to wait for deliveries after send
 *   LOAD_TEST_JOIN_SETTLE_MS (default 1500) — delay after join before send
 *   LOAD_TEST_MIN_DELIVERY_RATE (default 0.99) — pass if each channel hits this ratio
 *   LOAD_TEST_MIN_CONNECT_RATE (default 0.99) — pass if each channel hits this ratio
 *   LOAD_TEST_PROVISION_BATCH (default 8) — parallel register/login batch size
 *
 * Run: npm run socket:broadcast (repo root) or cd load-tests && npm run socket:broadcast
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import axios from "axios";
import dotenv from "dotenv";
import { io as ioc } from "socket.io-client";

import { makeLoadTestUsername } from "../scripts/loadtest-username.mjs";

const loadTestsRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
dotenv.config({ path: path.join(loadTestsRoot, ".env") });

const baseUrl = (
  process.env.LOAD_TEST_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");
const api = `${baseUrl}/api`;

const channelCount = Math.max(
  1,
  Number(process.env.LOAD_TEST_CHANNEL_COUNT || 5),
);
const membersPerChannel = Math.max(
  2,
  Number(process.env.LOAD_TEST_MEMBERS_PER_CHANNEL || 20),
);
const broadcastWaitMs = Math.max(
  5000,
  Number(process.env.LOAD_TEST_BROADCAST_WAIT_MS || 25_000),
);
const joinSettleMs = Math.max(
  200,
  Number(process.env.LOAD_TEST_JOIN_SETTLE_MS || 1500),
);
const minDeliveryRate = Number(process.env.LOAD_TEST_MIN_DELIVERY_RATE || 0.99);
const minConnectRate = Number(process.env.LOAD_TEST_MIN_CONNECT_RATE || 0.99);
const provisionBatch = Math.max(
  1,
  Number(process.env.LOAD_TEST_PROVISION_BATCH || 8),
);
const socketTimeoutMs = Math.max(
  10_000,
  Number(process.env.LOAD_TEST_SOCKET_TIMEOUT_MS || 30_000),
);

const password = process.env.LOAD_TEST_PASSWORD || "Password123!";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** k6-style terminal bar (plain Node has no built-in progress UI). */
function formatProgressBar(ratio, width = 30) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * width);
  return `[${"=".repeat(filled)}${"-".repeat(width - filled)}]`;
}

function logProgress(label, current, total) {
  const ratio = total > 0 ? current / total : 1;
  const pct = (ratio * 100).toFixed(0);
  process.stdout.write(
    `\r${label} ${formatProgressBar(ratio)} ${current}/${total} (${pct}%)   `,
  );
  if (current >= total) {
    process.stdout.write("\n");
  }
}

async function sleepWithProgress(ms, label) {
  const start = Date.now();
  const tickMs = 500;

  while (Date.now() - start < ms) {
    const elapsed = Date.now() - start;
    logProgress(label, elapsed, ms);
    await sleep(Math.min(tickMs, ms - elapsed));
  }

  logProgress(label, ms, ms);
}

function percentile(sorted, p) {
  if (!sorted.length) {
    return 0;
  }
  const idx = Math.ceil((p / 100) * sorted.length) - 1;

  return sorted[Math.max(0, idx)];
}

async function runInBatches(items, batchSize, fn, onProgress) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
    onProgress?.(results.length, items.length);
  }

  return results;
}

async function registerAndLogin(channelIndex, memberIndex) {
  const username = makeLoadTestUsername("g", `${channelIndex}${memberIndex}`);
  const email = `${username}@example.com`;

  const reg = await axios.post(`${api}/auth/register`, {
    username,
    email,
    password,
    repeatPassword: password,
  });

  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error(
      `register failed ${reg.status}: ${JSON.stringify(reg.data)}`,
    );
  }

  const login = await axios.post(`${api}/auth/login`, { email, password });

  if (login.status !== 200) {
    throw new Error(
      `login failed ${login.status}: ${JSON.stringify(login.data)}`,
    );
  }

  const setCookie = login.headers["set-cookie"];
  const accessLine = Array.isArray(setCookie)
    ? setCookie.find((c) => c.startsWith("access_token="))
    : String(setCookie || "");

  const accessCookie = accessLine ? accessLine.split(";")[0] : null;

  if (!accessCookie) {
    throw new Error(`no access_token cookie for ${email}`);
  }

  return {
    username,
    email,
    userId: login.data.id,
    accessCookie,
  };
}

async function createGroupChannel(creator, memberIds, channelIndex) {
  const uniqueIds = [...new Set(memberIds)];

  const res = await axios.post(
    `${api}/channels/create`,
    {
      channelName: `bc_ch${channelIndex}_${Date.now().toString(36)}`,
      memberIds: uniqueIds,
    },
    { headers: { Cookie: creator.accessCookie } },
  );

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(
      `create channel failed ${res.status}: ${JSON.stringify(res.data)}`,
    );
  }

  return res.data.channelId;
}

function openMemberSocket(member, channelId) {
  return new Promise((resolve) => {
    const state = {
      member,
      connected: false,
      received: false,
      latencyMs: null,
      error: null,
    };

    const socket = ioc(baseUrl, {
      path: "/api/socket.io",
      transports: ["websocket"],
      extraHeaders: { Cookie: member.accessCookie },
      reconnection: false,
      timeout: socketTimeoutMs,
    });

    state.attachBroadcast = (marker, t0) => {
      socket.on("new_message", (payload) => {
        if (state.received) {
          return;
        }

        if (payload?.content === marker) {
          state.received = true;
          state.latencyMs = Date.now() - t0;
        }
      });
    };

    state.sendBroadcast = (marker) => {
      socket.emit("send_message", {
        channelId,
        senderUsername: member.username,
        content: marker,
        sentAt: new Date().toISOString(),
      });
    };

    state.close = () => {
      try {
        socket.removeAllListeners();
        socket.close();
      } catch {
        /* ignore */
      }
    };

    const connectTimeout = setTimeout(() => {
      if (!state.connected && !state.error) {
        state.error = "connect_timeout";
        state.close();
        resolve(state);
      }
    }, socketTimeoutMs + 2000);

    const settle = () => {
      clearTimeout(connectTimeout);
      resolve(state);
    };

    socket.on("connect", () => {
      state.connected = true;
      socket.emit("join_all_user_channels", { channelIds: [channelId] });
      settle();
    });

    socket.on("connect_error", (err) => {
      state.error = `connect_error: ${err?.message || err}`;
      state.close();
      settle();
    });

    socket.on("error", (err) => {
      if (!state.error) {
        state.error = `socket_error: ${err?.message || err}`;
      }
    });
  });
}

async function runChannelBroadcast(channelIndex, members, channelId) {
  const nonce = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const marker = `bc|${channelId}|${nonce}`;

  const sockets = await Promise.all(
    members.map((m) => openMemberSocket(m, channelId)),
  );
  logProgress(
    `  ch${channelIndex + 1} websocket connect`,
    sockets.filter((s) => s.connected).length,
    members.length,
  );

  const notConnected = sockets.filter((s) => !s.connected);
  if (notConnected.length) {
    sockets.forEach((s) => s.close());

    return {
      channelIndex,
      channelId,
      memberCount: members.length,
      connected: sockets.filter((s) => s.connected).length,
      delivered: 0,
      connectRate: (members.length - notConnected.length) / members.length,
      deliveryRate: 0,
      latencies: [],
      marker,
      error: `${notConnected.length} failed to connect`,
    };
  }

  await sleep(joinSettleMs);

  const t0 = Date.now();
  for (const s of sockets) {
    s.attachBroadcast(marker, t0);
  }
  sockets[0].sendBroadcast(marker);

  await sleepWithProgress(
    broadcastWaitMs,
    `  ch${channelIndex + 1} waiting for deliveries`,
  );
  sockets.forEach((s) => s.close());

  const connected = sockets.filter((s) => s.connected).length;
  const delivered = sockets.filter((s) => s.received).length;
  const latencies = sockets
    .filter((s) => s.received && s.latencyMs != null)
    .map((s) => s.latencyMs);

  return {
    channelIndex,
    channelId,
    memberCount: members.length,
    connected,
    delivered,
    connectRate: connected / members.length,
    deliveryRate: delivered / members.length,
    latencies,
    marker,
    error: null,
  };
}

async function provisionChannel(channelIndex) {
  const memberSlots = Array.from({ length: membersPerChannel }, (_, i) => ({
    channelIndex,
    memberIndex: i,
  }));

  const members = await runInBatches(
    memberSlots,
    provisionBatch,
    ({ channelIndex: ci, memberIndex: mi }) => registerAndLogin(ci, mi),
    (done, total) =>
      logProgress(`  ch${channelIndex + 1} register/login`, done, total),
  );

  const channelId = await createGroupChannel(
    members[0],
    members.map((m) => m.userId),
    channelIndex,
  );

  return { channelIndex, channelId, members };
}

console.log("--- Group broadcast load test (Option A) ---");
console.log(`base: ${baseUrl}`);
console.log(
  `channels: ${channelCount} × ${membersPerChannel} members = ${channelCount * membersPerChannel} users to provision`,
);
console.log(
  `pass rules: connect ≥ ${(minConnectRate * 100).toFixed(0)}%, delivery ≥ ${(minDeliveryRate * 100).toFixed(0)}% per channel\n`,
);

const channels = [];

for (let c = 0; c < channelCount; c++) {
  logProgress("Provision channels", c, channelCount);
  channels.push(await provisionChannel(c));
}
logProgress("Provision channels", channelCount, channelCount);

const results = [];

for (let i = 0; i < channels.length; i++) {
  const ch = channels[i];
  logProgress(
    `Broadcast (${ch.members.length} members/socket)`,
    i,
    channels.length,
  );

  results.push(
    await runChannelBroadcast(ch.channelIndex, ch.members, ch.channelId),
  );
}
logProgress(
  `Broadcast (${channels[0]?.members.length ?? 0} members/socket)`,
  channels.length,
  channels.length,
);

const allLatencies = results.flatMap((r) => r.latencies).sort((a, b) => a - b);

console.log("\n--- Per channel ---");
console.log(
  "ch | members | connected | delivered | conn% | deliv% | p95 ms | status",
);
for (const r of results) {
  const p95 = r.latencies.length
    ? percentile(
        [...r.latencies].sort((a, b) => a - b),
        95,
      )
    : 0;
  const connOk = r.connectRate >= minConnectRate;
  const delivOk = r.deliveryRate >= minDeliveryRate;
  const status = connOk && delivOk ? "PASS" : "FAIL";
  console.log(
    `${String(r.channelIndex).padStart(2)} | ${String(r.memberCount).padStart(7)} | ${String(r.connected).padStart(9)} | ${String(r.delivered).padStart(9)} | ${(r.connectRate * 100).toFixed(1).padStart(5)}% | ${(r.deliveryRate * 100).toFixed(1).padStart(6)}% | ${String(Math.round(p95)).padStart(6)} | ${status}${r.error ? ` (${r.error})` : ""}`,
  );
}

const channelsPassed = results.filter(
  (r) => r.connectRate >= minConnectRate && r.deliveryRate >= minDeliveryRate,
).length;

console.log("\n--- Overall ---");
console.log(`channels passed: ${channelsPassed}/${results.length}`);

if (allLatencies.length) {
  const avg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;

  console.log(
    `delivery latency ms — p50 ${percentile(allLatencies, 50).toFixed(0)}, p95 ${percentile(allLatencies, 95).toFixed(0)}, p99 ${percentile(allLatencies, 99).toFixed(0)}, mean ${avg.toFixed(0)}`,
  );
}

const totalMembers = results.reduce((n, r) => n + r.memberCount, 0);
const totalDelivered = results.reduce((n, r) => n + r.delivered, 0);
console.log(
  `aggregate delivery: ${totalDelivered}/${totalMembers} (${((totalDelivered / totalMembers) * 100).toFixed(2)}%)`,
);

if (channelsPassed < results.length) {
  process.exitCode = 1;
}
