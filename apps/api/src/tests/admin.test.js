import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Admin API Authorization Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  let adminToken = "";
  let clientToken = "";

  // 1. Register admin to get admin token
  const adminReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    })
  });
  if (adminReg.status === 201) {
    const payload = await adminReg.json();
    adminToken = payload.data.token;
  }

  // 2. Register client to get client token
  const clientReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "client@example.com",
      password: "password123",
      role: "client"
    })
  });
  if (clientReg.status === 201) {
    const payload = await clientReg.json();
    clientToken = payload.data.token;
  }

  await t.test("GET /api/admin/metrics with client token returns 403", async () => {
    assert.ok(clientToken, "Should have a client token");
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${clientToken}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });

  await t.test("GET /api/admin/metrics with admin token returns 200", async () => {
    assert.ok(adminToken, "Should have an admin token");
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
