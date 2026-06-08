import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("POST /api/auth/register returns token sub matching returned user id", async () => {
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

  const r = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "secret123", role: "client" })
  });

  assert.equal(r.status, 201);
  const body = await r.json();
  assert.ok(body.success);
  assert.ok(body.data?.id, "Should return a user id");
  assert.ok(body.data?.token, "Should return a token");

  const decoded = verifyAccessToken(body.data.token);
  assert.equal(
    decoded.sub,
    body.data.id,
    `Token sub (${decoded.sub}) must match returned user id (${body.data.id})`
  );

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
