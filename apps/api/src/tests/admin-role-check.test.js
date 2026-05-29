import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/admin/metrics rejects non-admin users with 403", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  // Create a token for a regular client user
  const clientToken = signAccessToken({ sub: "usr_test", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  assert.equal(response.status, 403);

  await closeServer(server);
});

test("GET /api/admin/metrics rejects freelancer users with 403", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const freelancerToken = signAccessToken({
    sub: "usr_test",
    role: "freelancer",
  });

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${freelancerToken}` },
  });

  assert.equal(response.status, 403);

  await closeServer(server);
});

test("GET /api/admin/metrics allows admin users with 200", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.equal(response.status, 200);

  await closeServer(server);
});
