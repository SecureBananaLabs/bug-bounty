import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Admin Route: /api/admin/metrics access control", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/admin/metrics`;

  try {
    // 1. Unauthenticated request (no header)
    const resp1 = await fetch(baseUrl);
    assert.equal(resp1.status, 401);
    const payload1 = await resp1.json();
    assert.equal(payload1.message, "Unauthorized");

    // 2. Authenticated but non-admin request (client role)
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const resp2 = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${clientToken}`
      }
    });
    assert.equal(resp2.status, 403);
    const payload2 = await resp2.json();
    assert.equal(payload2.message, "Forbidden");

    // 3. Authenticated admin request
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const resp3 = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.equal(resp3.status, 200);
    const payload3 = await resp3.json();
    assert.ok(payload3.success);
    assert.ok(payload3.data.hasOwnProperty("openJobs"));
    assert.ok(payload3.data.hasOwnProperty("activeFreelancers"));
    assert.equal(payload3.data.openJobs, 42);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
