import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects malformed user creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", name: "" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user payload"
    });
  });
});

test("POST /api/users stores only validated user fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "validated@example.com",
        name: "Validated User",
        role: "client",
        isAdmin: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.email, "validated@example.com");
    assert.equal(payload.data.name, "Validated User");
    assert.equal(payload.data.role, "client");
    assert.equal(payload.data.isAdmin, undefined);
  });
});
