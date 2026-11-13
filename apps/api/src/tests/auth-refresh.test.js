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

test("POST /api/auth/refresh rejects a request without a bearer token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, { method: "POST" });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/refresh rejects an invalid token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-token" }
    });
    assert.equal(response.status, 401);
  });
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_123", role: "freelancer" });

    const response = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.success, true);

    const refreshed = payload.data.token;
    assert.equal(typeof refreshed, "string");

    const verified = verifyAccessToken(refreshed);
    assert.equal(verified.sub, "usr_123");
    assert.equal(verified.role, "freelancer");
  });
});
