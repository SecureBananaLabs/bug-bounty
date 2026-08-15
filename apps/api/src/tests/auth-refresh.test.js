import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRefresh(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return { response, payload: await response.json() };
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postRefresh(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Refresh token is required");
  });
});

test("POST /api/auth/refresh rejects invalid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postRefresh(baseUrl, { token: "not-a-jwt" });

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid refresh token");
  });
});

test("POST /api/auth/refresh rejects signed tokens without identity fields", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ scope: "refresh" });
    const { response, payload } = await postRefresh(baseUrl, { token });

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid refresh token");
  });
});

test("POST /api/auth/refresh preserves the verified token subject and role", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_refresh_subject", role: "freelancer" });
    const { response, payload } = await postRefresh(baseUrl, { token });

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");

    const refreshedPayload = verifyAccessToken(payload.data.token);
    assert.equal(refreshedPayload.sub, "usr_refresh_subject");
    assert.equal(refreshedPayload.role, "freelancer");
  });
});
