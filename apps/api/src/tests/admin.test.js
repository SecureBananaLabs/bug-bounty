import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/admin/metrics with admin token returns 200", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "admin_123", role: "admin" });

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(res.status, 200, "Admin should get 200");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics with non-admin token returns 403", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "user_123", role: "client" });

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(res.status, 403, "Non-admin should get 403");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics without token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);

  assert.equal(res.status, 401, "Missing token should get 401");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
