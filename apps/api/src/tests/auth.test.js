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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRefresh(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Refresh token is required"
    });
  });
});

test("POST /api/auth/refresh rejects invalid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { token: "not-a-valid-token" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid refresh token"
    });
  });
});

test("POST /api/auth/refresh preserves decoded subject and role", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
    const response = await postRefresh(baseUrl, { token });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");

    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_refresh");
    assert.equal(decoded.role, "freelancer");
  });
});
