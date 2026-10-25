import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/admin/metrics rejects a request with no token", async () => {
  const server = await startServer();
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  assert.equal(response.status, 401);
  await closeServer(server);
});

test("GET /api/admin/metrics forbids a non-admin (client) user", async () => {
  const server = await startServer();
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_client", role: "client" });
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(response.status, 403);
  await closeServer(server);
});

test("GET /api/admin/metrics allows an admin user", async () => {
  const server = await startServer();
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.openJobs, 42);
  await closeServer(server);
});
