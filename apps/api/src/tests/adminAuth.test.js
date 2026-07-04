import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

test("Admin route role-based access control", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("allows admin token to call metrics", async () => {
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(body.data.openJobs !== undefined);
  });

  await t.test("rejects client token with 403", async () => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${clientToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test("rejects freelancer token with 403", async () => {
    const freelancerToken = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${freelancerToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test("rejects unauthenticated request with 401", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
  });
});
