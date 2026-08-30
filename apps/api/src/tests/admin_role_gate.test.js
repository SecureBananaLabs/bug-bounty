import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes enforce admin role authorization", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Missing Authorization header -> 401 Unauthorized
    const unauthRes = await fetch(`${baseUrl}/api/admin/metrics`);
    const unauthPayload = await unauthRes.json();
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthPayload.success, false);
    assert.equal(unauthPayload.message, "Unauthorized");

    // 2. Authenticated client -> 403 Forbidden
    const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });
    const clientRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const clientPayload = await clientRes.json();
    assert.equal(clientRes.status, 403);
    assert.equal(clientPayload.success, false);
    assert.equal(clientPayload.message, "Forbidden");

    // 3. Authenticated freelancer -> 403 Forbidden
    const freelancerToken = signAccessToken({ sub: "usr_freelancer_1", role: "freelancer" });
    const freelancerRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${freelancerToken}` }
    });
    const freelancerPayload = await freelancerRes.json();
    assert.equal(freelancerRes.status, 403);
    assert.equal(freelancerPayload.success, false);
    assert.equal(freelancerPayload.message, "Forbidden");

    // 4. Authenticated admin -> 200 OK
    const adminToken = signAccessToken({ sub: "usr_admin_1", role: "admin" });
    const adminRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminPayload = await adminRes.json();
    assert.equal(adminRes.status, 200);
    assert.equal(adminPayload.success, true);
    assert.ok(adminPayload.data);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
