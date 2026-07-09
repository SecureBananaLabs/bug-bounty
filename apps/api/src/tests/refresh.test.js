import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh rejects requests without a token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const addr = server.address();
  const port = addr.port;
  const host = addr.family === "IPv6" ? `[::1]` : "127.0.0.1";
  const base = `http://${host}:${port}`;

  const r1 = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(r1.status, 400, "Expected 400 for missing token");

  const body1 = await r1.json();
  assert.equal(body1.success, false);

  // With a valid token, it should succeed and preserve sub/role
  const validToken = signAccessToken({ sub: "usr_test123", role: "freelancer" });
  const r2 = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: validToken })
  });
  assert.equal(r2.status, 200, "Expected 200 for valid token");

  const body2 = await r2.json();
  assert.ok(body2.success);
  assert.ok(body2.data?.token, "Should return a new token");

  // Verify the new token has the same sub and role
  const { verifyAccessToken } = await import("../utils/jwt.js");
  const decoded = verifyAccessToken(body2.data.token);
  assert.equal(decoded.sub, "usr_test123");
  assert.equal(decoded.role, "freelancer");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
