import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function requestAdminMetrics(authorization) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: authorization ? { authorization } : {}
    });
    const payload = await response.json();
    return { response, payload };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth middleware accepts a valid bearer token with canonical spacing", async () => {
  const token = signAccessToken({ sub: "usr_test", role: "admin" });
  const { response, payload } = await requestAdminMetrics(`Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
});

test("auth middleware trims a valid bearer token after flexible spacing", async () => {
  const token = signAccessToken({ sub: "usr_test", role: "admin" });
  const { response, payload } = await requestAdminMetrics(`Bearer    ${token}`);

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
});

test("auth middleware rejects malformed authorization headers", async () => {
  const { response, payload } = await requestAdminMetrics("Token not-a-bearer-token");

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });
});

test("auth middleware rejects invalid bearer tokens", async () => {
  const { response, payload } = await requestAdminMetrics("Bearer not-a-valid-token");

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });
});
