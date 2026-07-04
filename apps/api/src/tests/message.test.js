import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Message API Auth Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  let token = "";

  // Get a valid token from login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123"
    })
  });
  if (loginRes.status === 200) {
    const payload = await loginRes.json();
    token = payload.data.token;
  }

  await t.test("GET /api/messages without token returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/messages without token returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: 2,
        content: "Hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });

  await t.test("GET /api/messages with valid token returns 200", async () => {
    assert.ok(token, "Should have a valid token from login");
    const response = await fetch(`${baseUrl}/api/messages`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
