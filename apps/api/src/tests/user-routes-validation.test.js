import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    for (const body of [
      {},
      { email: "not-an-email", password: "password123" },
      { email: "user@example.com", password: "short" },
      { email: "user@example.com", password: "password123", role: "invalid" }
    ]) {
      const response = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });

      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid user payload"
      });
    }
  });
});

test("POST /api/users accepts valid payloads and preserves extra fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
        role: "freelancer",
        displayName: "Maya"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "user@example.com");
    assert.equal(payload.data.role, "freelancer");
    assert.equal(payload.data.displayName, "Maya");
    assert.match(payload.data.id, /^usr_/);
  });
});
