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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRefresh(baseUrl, payload) {
  return fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Refresh token is required"
    });
  });
});

test("POST /api/auth/refresh rejects invalid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { token: "not-a-valid-token" });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
      success: false,
      message: "Invalid refresh token"
    });
  });
});

test("POST /api/auth/refresh preserves subject and role from valid token", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
    const response = await postRefresh(baseUrl, { token });
    const body = await response.json();
    const refreshedPayload = verifyAccessToken(body.data.token);

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(refreshedPayload.sub, "usr_refresh");
    assert.equal(refreshedPayload.role, "freelancer");
  });
});
