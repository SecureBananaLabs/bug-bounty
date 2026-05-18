import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Admin API Endpoints", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const BASE_URL = `http://127.0.0.1:${port}/api/admin`;
  
  const adminToken = signAccessToken({ sub: "admin_1", role: "admin" });
  const userToken = signAccessToken({ sub: "user_1", role: "client" });

  await t.test("GET /metrics returns ok for admins", async () => {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.ok(payload.data.openJobs);
  });

  await t.test("GET /metrics returns 403 for non-admins", async () => {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test("PATCH /users/:id/status updates status", async () => {
    const res = await fetch(`${BASE_URL}/users/usr_1/status`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "banned", reason: "Fraud" })
    });
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.data.status, "banned");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
