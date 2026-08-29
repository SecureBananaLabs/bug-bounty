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
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/users rejects invalid input with 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/users accepts valid input and strips server-managed fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        fullName: "Client User",
        id: "usr_injected",
        role: "admin",
        isVerified: true,
        createdAt: "2026-05-30T00:00:00.000Z"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "client@example.com");
    assert.equal(payload.data.fullName, "Client User");
    assert.match(payload.data.id, /^usr_\d+$/);
    assert.notEqual(payload.data.id, "usr_injected");
    assert.equal(Object.hasOwn(payload.data, "role"), false);
    assert.equal(Object.hasOwn(payload.data, "isVerified"), false);
    assert.equal(Object.hasOwn(payload.data, "createdAt"), false);
  });
});
