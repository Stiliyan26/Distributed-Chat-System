import { check } from "k6";
import http from "k6/http";

/**
 * Builds a username valid for RegisterUserRequestDto: 5–15 chars, /^[a-zA-Z0-9_]+$/.
 * @param {string} prefix
 */
function generateValidRegisterUsername(prefix) {
  const safePrefix =
    String(prefix)
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 3) || "lt";

  const noise =
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.replace(
      /[^a-z0-9]/gi,
      "",
    );

  let username = `${safePrefix}_${noise}`;
  username = username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 15);

  if (username.length < 5) {
    username = `${username}_xxxx`.slice(0, 15);
  }

  return username;
}

/**
 * Extracts `access_token=...` (first segment before `;`) from Set-Cookie header(s).
 * @param {string | string[] | undefined} rawSetCookie
 */
export function extractAccessTokenCookieValue(rawSetCookie) {
  if (!rawSetCookie) {
    return null;
  }

  const parts = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
  const accessLine = parts.find((line) =>
    line.trim().startsWith("access_token="),
  );

  if (!accessLine) {
    return null;
  }

  return accessLine.split(";")[0].trim();
}

/** API gateway origin from env (no path): e.g. http://localhost:3000 */
export function getApiGatewayBaseUrl() {
  return __ENV.LOAD_TEST_BASE_URL || "http://localhost:3000";
}

/**
 * POST /api/auth/login (JSON body). Parses Set-Cookie for access_token.
 * @returns {{ ok: boolean, accessCookie: string | null, response: object }}
 */
export function postLoginAndGetAccessCookie(baseUrl, email, password) {
  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  );

  const loginOk = check(response, { "login 200": (r) => r.status === 200 });

  if (!loginOk) {
    return { ok: false, accessCookie: null, response };
  }

  const accessCookie = extractAccessTokenCookieValue(
    response.headers["Set-Cookie"],
  );

  return { ok: accessCookie != null, accessCookie, response };
}

/**
 * Produces cookie + channel + user for messaging tests.
 * Uses LOAD_TEST_EMAIL / LOAD_TEST_CHANNEL_ID when both set; otherwise registers one user and channel in setup().
 */
export function resolveMessagingFixture(baseUrl) {
  const empty = {
    ok: false,
    accessCookie: null,
    channelId: null,
    username: null,
    userId: null,
  };

  if (__ENV.LOAD_TEST_CHANNEL_ID && __ENV.LOAD_TEST_EMAIL) {
    const auth = postLoginAndGetAccessCookie(
      baseUrl,
      __ENV.LOAD_TEST_EMAIL,
      __ENV.LOAD_TEST_PASSWORD || "Password123!",
    );

    if (!auth.ok || !auth.accessCookie) {
      return empty;
    }

    return {
      ok: true,
      accessCookie: auth.accessCookie,
      channelId: __ENV.LOAD_TEST_CHANNEL_ID,
      username: auth.response.json("username"),
      userId: auth.response.json("id"),
    };
  }

  const channelNameSuffix = `${Date.now()}`;
  const username = generateValidRegisterUsername("k6");
  const email = `${username}@example.com`;
  const password = __ENV.LOAD_TEST_PASSWORD || "Password123!";

  const registerResponse = http.post(
    `${baseUrl}/api/auth/register`,
    JSON.stringify({ username, email, password, repeatPassword: password }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(registerResponse, {
    "register created": (r) => r.status === 201 || r.status === 200,
  });

  const auth = postLoginAndGetAccessCookie(baseUrl, email, password);

  if (!auth.ok || !auth.accessCookie) {
    return empty;
  }

  const userId = auth.response.json("id");

  const createChannelResponse = http.post(
    `${baseUrl}/api/channels/create`,
    JSON.stringify({
      channelName: `k6-ch-${channelNameSuffix}`,
      memberIds: [userId],
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: auth.accessCookie,
      },
    },
  );

  const channelOk = check(createChannelResponse, {
    "channel created": (r) => r.status === 201 || r.status === 200,
  });

  const channelId = createChannelResponse.json("channelId");

  if (!channelOk || !channelId) {
    return empty;
  }

  return {
    ok: true,
    accessCookie: auth.accessCookie,
    channelId,
    username,
    userId,
  };
}
