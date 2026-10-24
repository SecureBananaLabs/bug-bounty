import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register rejects duplicate emails case-insensitively", async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      email: `duplicate-${Date.now()}@example.com`,
      password: "password123",
      role: "client"
    };

    const firstResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const firstBody = await firstResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(firstBody.success, true);
    assert.equal(firstBody.data.email, payload.email);

    const secondResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, email: payload.email.toUpperCase() })
    });
    const secondBody = await secondResponse.json();

    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondBody, { success: false, message: "Email already registered" });
  });
});
