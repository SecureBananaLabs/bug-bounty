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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postRefresh(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing tokens", async () => {
  await withServer(async (port) => {
    const response = await postRefresh(port, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Refresh token required");
  });
});

test("POST /api/auth/refresh rejects invalid tokens", async () => {
  await withServer(async (port) => {
    const response = await postRefresh(port, { token: "not-a-token" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  });
});

test("POST /api/auth/refresh preserves token subject and role", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_refreshable", role: "freelancer" });
    const response = await postRefresh(port, { token });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_refreshable");
    assert.equal(decoded.role, "freelancer");
  });
});
