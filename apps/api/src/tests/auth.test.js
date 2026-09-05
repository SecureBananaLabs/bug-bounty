import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Authentication & Registration API Tests", async (t) => {
  await t.test("POST /api/auth/register with client role should succeed", async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test_client@example.com",
        password: "securepassword123",
        role: "client"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "test_client@example.com");
    assert.equal(payload.data.role, "client");
    assert.ok(payload.data.token);

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST /api/auth/register with freelancer role should succeed", async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test_freelancer@example.com",
        password: "securepassword123",
        role: "freelancer"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "freelancer");

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST /api/auth/register with admin role should fail (role restriction)", async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker_admin@example.com",
        password: "securepassword123",
        role: "admin"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes("Invalid enum value") || payload.message.includes("role"));

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});
