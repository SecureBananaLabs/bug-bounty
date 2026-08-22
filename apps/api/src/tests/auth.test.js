import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("auth flow integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/register fails with role: admin", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testadmin@example.com",
        password: "securepassword123",
        role: "admin"
      })
    });

    // Since registerSchema.parse throws a ZodError which is caught by errorHandler and returns 500
    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/auth/register succeeds with role: client", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "securepassword123",
        role: "client"
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "client@example.com");
    assert.equal(payload.data.role, "client");
    assert.ok(payload.data.token);
  });

  await t.test("POST /api/auth/register succeeds with role: freelancer", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "freelancer@example.com",
        password: "securepassword123",
        role: "freelancer"
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "freelancer@example.com");
    assert.equal(payload.data.role, "freelancer");
  });

  await t.test("POST /api/auth/refresh passes token successfully", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "sample-refresh-token"
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
