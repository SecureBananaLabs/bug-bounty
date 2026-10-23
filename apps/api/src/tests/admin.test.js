import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

describe("Admin RBAC Metrics Guard", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    }
  });

  test("Missing token returns HTTP 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });

  test("Invalid token returns HTTP 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: "Bearer invalid.token.value" }
    });
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });

  test("Client token (role: 'client') returns HTTP 403 Forbidden", async () => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.equal(data.message, "Forbidden: insufficient permissions");
  });

  test("Freelancer token (role: 'freelancer') returns HTTP 403 Forbidden", async () => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.equal(data.message, "Forbidden: insufficient permissions");
  });

  test("Admin token (role: 'admin') returns HTTP 200 with admin metrics", async () => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.deepEqual(data.data, {
      openJobs: 42,
      activeFreelancers: 185,
      flaggedAccounts: 3,
      monthlyVolume: 128900
    });
  });
});
