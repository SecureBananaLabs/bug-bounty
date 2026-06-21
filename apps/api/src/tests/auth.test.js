import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Auth registration role validation and refresh token validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /api/auth/register with client role succeeds", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "test_client@example.com",
        password: "securepassword123",
        role: "client"
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "client");
  });

  await t.test("POST /api/auth/register with freelancer role succeeds", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close"
      },
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
  });

  await t.test("POST /api/auth/register with admin role fails validation", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "test_admin@example.com",
        password: "securepassword123",
        role: "admin"
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("POST /api/auth/refresh passes token to the service", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        token: "some-existing-refresh-token"
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);
  });

  server.close();
});
