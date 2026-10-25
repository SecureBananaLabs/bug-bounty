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

test("POST /api/auth/register rejects public admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "new-admin@example.com",
        password: "password123",
        role: "admin"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.match(JSON.stringify(payload.issues), /role/);
  });
});

test("POST /api/auth/register still accepts public client and freelancer roles", async () => {
  await withServer(async (baseUrl) => {
    for (const role of ["client", "freelancer"]) {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `${role}@example.com`,
          password: "password123",
          role
        })
      });
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.equal(payload.data.role, role);
      assert.equal(typeof payload.data.token, "string");
    }
  });
});
