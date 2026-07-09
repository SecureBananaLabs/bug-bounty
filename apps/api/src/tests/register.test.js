import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Registration — admin role prevention", async (t) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/register — rejects admin role", async () => {
    const payload = {
      email: "attacker@example.com",
      password: "password123",
      role: "admin"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });

  await t.test("POST /api/auth/register — accepts client role", async () => {
    const payload = {
      email: "client@example.com",
      password: "password123",
      role: "client"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "client");
  });

  await t.test("POST /api/auth/register — accepts freelancer role", async () => {
    const payload = {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "freelancer");
  });

  await t.test("POST /api/auth/register — defaults to client when no role specified", async () => {
    const payload = {
      email: "default@example.com",
      password: "password123"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.role, "client");
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
