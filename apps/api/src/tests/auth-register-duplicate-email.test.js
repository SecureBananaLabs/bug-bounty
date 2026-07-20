import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register rejects duplicate email with predictable code", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const email = `dup-${Date.now()}@example.com`;

    const firstResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "StrongPass123!",
        role: "client"
      })
    });
    const firstPayload = await firstResponse.json();

    const secondResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email.toUpperCase(),
        password: "StrongPass123!",
        role: "client"
      })
    });
    const secondPayload = await secondResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(firstPayload.success, true);

    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondPayload, {
      success: false,
      code: "AUTH_EMAIL_EXISTS",
      message: "Email already registered"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
