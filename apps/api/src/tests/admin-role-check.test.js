import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

let server, baseUrl;

test.before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(() => {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("GET /api/admin/metrics rejects non-admin client token", async () => {
  const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.success, false);
});

test("GET /api/admin/metrics rejects non-admin freelancer token", async () => {
  const freelancerToken = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  });
  assert.equal(res.status, 403);
});

test("GET /api/admin/metrics allows admin token", async () => {
  const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
});

test("GET /api/admin/metrics requires auth", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`);
  assert.equal(res.status, 401);
});
