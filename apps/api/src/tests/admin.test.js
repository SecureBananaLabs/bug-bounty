import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/admin/metrics without authorization header returns HTTP 401", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Unauthorized");
});

test("GET /api/admin/metrics with invalid bearer token returns HTTP 401", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: "Bearer invalid.token.here" }
  });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid token");
});

test("GET /api/admin/metrics with valid freelancer token returns HTTP 403", async () => {
  const token = signAccessToken({ id: "u_free", email: "free@example.com", role: "freelancer" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  assert.equal(res.status, 403);
  assert.equal(body.success, false);
  assert.equal(body.message, "Forbidden: insufficient permissions");
});

test("GET /api/admin/metrics with valid client token returns HTTP 403", async () => {
  const token = signAccessToken({ id: "u_client", email: "client@example.com", role: "client" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  assert.equal(res.status, 403);
  assert.equal(body.success, false);
  assert.equal(body.message, "Forbidden: insufficient permissions");
});

test("GET /api/admin/metrics with valid admin token returns HTTP 200 with admin metrics", async () => {
  const token = signAccessToken({ id: "u_admin", email: "admin@example.com", role: "admin" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.data, {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900
  });
});
