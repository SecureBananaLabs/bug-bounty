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

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function register(baseUrl, role) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: `${role}-${Date.now()}@example.com`,
      password: "password123",
      role
    })
  });
}

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await register(baseUrl, "admin");
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/register accepts public client and freelancer roles", async () => {
  await withServer(async (baseUrl) => {
    for (const role of ["client", "freelancer"]) {
      const response = await register(baseUrl, role);
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.equal(payload.data.role, role);
    }
  });
});
