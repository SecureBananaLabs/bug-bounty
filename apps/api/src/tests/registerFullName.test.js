import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

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

test("POST /api/auth/register rejects a missing fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "new-client@example.com",
        password: "password123",
        role: "client"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid registration payload");
  });
});

test("POST /api/auth/register preserves a valid fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "new-client@example.com",
        fullName: "  Ada Lovelace  ",
        password: "password123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "new-client@example.com");
    assert.equal(payload.data.fullName, "Ada Lovelace");
    assert.equal(payload.data.role, "client");
    assert.equal(typeof payload.data.token, "string");
  });
});
