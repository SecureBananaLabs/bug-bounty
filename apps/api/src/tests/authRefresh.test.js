import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("refresh: unauthenticated request is rejected with 401", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, { method: "POST" });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("refresh: invalid bearer token is rejected with 401", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: "Bearer not-a-real-token" }
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("refresh: authenticated caller receives a token for their own subject and role", async () => {
  const app = createApp();
  const callerToken = signAccessToken({ sub: "usr_42", role: "freelancer" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${callerToken}` }
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.token, "expected a refreshed token");

    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_42");
    assert.equal(decoded.role, "freelancer");
  });
});

test("refresh: does not fall back to the hard-coded usr_existing/client identity", async () => {
  const app = createApp();
  const callerToken = signAccessToken({ sub: "usr_99", role: "client" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${callerToken}` }
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_99");
    assert.notEqual(decoded.sub, "usr_existing");
  });
});
