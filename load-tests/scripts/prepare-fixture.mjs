import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import axios from "axios";
import dotenv from "dotenv";

import { makeLoadTestUsername } from "./loadtest-username.mjs";

const loadTestsRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const envPath = path.join(loadTestsRoot, ".env");
const examplePath = path.join(loadTestsRoot, ".env.example");

dotenv.config({ path: envPath });

const http = axios.create({ validateStatus: () => true });

async function main() {
  const baseUrl = resolveBaseUrl();
  const api = `${baseUrl}/api`;

  const username = makeLoadTestUsername("lt");
  const email = `${username}@example.com`;
  const password = process.env.LOAD_TEST_PASSWORD || "Password123!";

  try {
    await registerUser(api, { username, email, password });

    const loginRes = await loginUser(api, { email, password });
    const userId = loginRes.data.id;
    const accessCookie = extractAccessCookie(loginRes.headers["set-cookie"]);

    const channelId = await createChannel(api, accessCookie, userId);

    writeFixtureEnv({
      LOAD_TEST_BASE_URL: baseUrl,
      LOAD_TEST_EMAIL: email,
      LOAD_TEST_PASSWORD: password,
      LOAD_TEST_CHANNEL_ID: channelId,
      LOAD_TEST_ACCESS_COOKIE: accessCookie,
    });

    printSummary({ baseUrl, userId, username, email, password, channelId });
  } catch (err) {
    handleAxiosConnectionError(err, baseUrl);
  }
}

function resolveBaseUrl() {
  return (
    process.argv[2] ||
    process.env.LOAD_TEST_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function registerUser(api, { username, email, password }) {
  const res = await http.post(`${api}/auth/registerRequestister`, {
    username,
    email,
    password,
    repeatPassword: password,
  });
  if (res.status !== 201 && res.status !== 200) {
    console.error("Register failed:", res.status, res.data);
    process.exit(1);
  }
}

async function loginUser(api, { email, password }) {
  const res = await http.post(`${api}/auth/login`, { email, password });
  if (res.status !== 200) {
    console.error("Login failed:", res.status, res.data);
    process.exit(1);
  }
  return res;
}

function extractAccessCookie(setCookie) {
  if (!setCookie?.length) {
    console.error("No Set-Cookie on login");
    process.exit(1);
  }
  const accessLine = setCookie.find((c) => c.startsWith("access_token="));
  const accessCookie = accessLine ? accessLine.split(";")[0] : null;
  if (!accessCookie) {
    console.error("Could not parse access_token cookie");
    process.exit(1);
  }

  return accessCookie;
}

async function createChannel(api, accessCookie, userId) {
  const res = await http.post(
    `${api}/channels/create`,
    { channelName: `load_${Date.now().toString(36)}`, memberIds: [userId] },
    { headers: { Cookie: accessCookie } },
  );

  if (res.status !== 201 && res.status !== 200) {
    console.error("Create channel failed:", res.status, res.data);
    process.exit(1);
  }

  return res.data.channelId;
}

function writeFixtureEnv(updates) {
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log("Created .env from .env.example");
  }

  upsertEnvKeys(envPath, updates);
}

function printSummary({
  baseUrl,
  userId,
  username,
  email,
  password,
  channelId,
}) {
  console.log("\nUpdated load-tests/.env with a fresh fixture user + channel.");
  console.log("userId:", userId, "| username:", username);
  console.log("\nYou can still export for a one-off shell:");
  console.log(`export LOAD_TEST_BASE_URL='${baseUrl}'`);
  console.log(`export LOAD_TEST_EMAIL='${email}'`);
  console.log(`export LOAD_TEST_PASSWORD='${password}'`);
  console.log(`export LOAD_TEST_CHANNEL_ID='${channelId}'`);
}

function handleAxiosConnectionError(err, baseUrl) {
  if (!axios.isAxiosError(err)) {
    throw err;
  }

  const { code } = err;

  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT"
  ) {
    console.error(
      `\nCannot reach the API at ${baseUrl} (${code}). Nothing is listening — usually the gateway is down.\n\n` +
        `From the repo root run:\n  npm run docker:all:up\n\n` +
        `Wait for services to be healthy, then:\n  npm run prepare:fixture\n`,
    );
    process.exit(1);
  }

  if (code === "ENOTFOUND") {
    console.error(
      `\nHost not found for ${baseUrl}. Check LOAD_TEST_BASE_URL in load-tests/.env.\n`,
    );
    process.exit(1);
  }

  throw err;
}

function formatEnvValue(value) {
  const s = String(value);
  if (/[\s#"']/.test(s) || s === "") {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

function upsertEnvKeys(filePath, kv) {
  const keys = new Set(Object.keys(kv));
  const lines = readFileSync(filePath, "utf8").split(/\n/);
  const out = [];
  const written = new Set();

  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && keys.has(m[1])) {
      out.push(`${m[1]}=${formatEnvValue(kv[m[1]])}`);
      written.add(m[1]);
    } else {
      out.push(line);
    }
  }

  for (const key of keys) {
    if (!written.has(key)) {
      out.push(`${key}=${formatEnvValue(kv[key])}`);
    }
  }

  writeFileSync(filePath, out.join("\n"));
}

await main();
