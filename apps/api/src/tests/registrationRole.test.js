import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Admin Registration Blocker", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/register rejects registration with role admin", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "malicious_admin@example.com",
        password: "password123",
        role: "admin"
      })
    });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  await t.test("POST /api/auth/register permits registration with client role", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "legit_client@example.com",
        password: "password123",
        role: "client"
      })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
  });
});
