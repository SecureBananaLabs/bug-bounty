import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("configured admin can authenticate and access admin APIs", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.adminEmail, password: env.adminPassword })
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(typeof payload.data.token, "string");

  const metrics = await fetch(`${base}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${payload.data.token}` }
  });
  assert.equal(metrics.status, 200);
}));

test("admin APIs reject missing and non-admin tokens", () => withServer(async (base) => {
  const missing = await fetch(`${base}/api/admin/metrics`);
  assert.equal(missing.status, 401);

  const clientToken = signAccessToken({ sub: "client-1", role: "client" });
  const forbidden = await fetch(`${base}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(forbidden.status, 403);
}));

test("admin login rejects invalid credentials", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.adminEmail, password: "wrong-password" })
  });
  assert.equal(response.status, 401);
}));
