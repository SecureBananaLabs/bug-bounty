import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/admin/metrics requires a bearer token", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);

  await close(server);
});

test("GET /api/admin/metrics rejects a non-admin token", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const token = signAccessToken({ sub: "usr_1", role: "freelancer" });
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Forbidden");

  await close(server);
});

test("GET /api/admin/metrics returns metrics for an admin token", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.openJobs, 42);
  assert.equal(typeof payload.data.monthlyVolume, "number");

  await close(server);
});
