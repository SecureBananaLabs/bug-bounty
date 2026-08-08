import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/refresh`, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/refresh rejects invalid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/refresh`, {
      token: "not-a-valid-token"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/refresh preserves the token subject and role", async () => {
  await withServer(async (baseUrl) => {
    const originalToken = signAccessToken({ sub: "usr_refresh_subject", role: "freelancer" });

    const response = await postJson(`${baseUrl}/api/auth/refresh`, {
      token: originalToken
    });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_refresh_subject");
    assert.equal(decoded.role, "freelancer");
  });
});
