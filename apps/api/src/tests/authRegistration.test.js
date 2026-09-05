import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function register(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      password: "password123",
      role: "client"
    })
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/auth/register rejects duplicate emails", async () => {
  await withServer(async (baseUrl) => {
    const email = `duplicate-${Date.now()}@example.com`;
    const first = await register(baseUrl, email);
    const second = await register(baseUrl, email);

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 409);
    assert.deepEqual(second.payload, {
      success: false,
      message: "Email already registered"
    });
  });
});

test("POST /api/auth/register rejects case-variant duplicate emails", async () => {
  await withServer(async (baseUrl) => {
    const suffix = Date.now();
    const first = await register(baseUrl, `Case-${suffix}@example.com`);
    const second = await register(baseUrl, `case-${suffix}@example.com`);

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 409);
  });
});
