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

test("POST /api/users omits submitted password from stored user records", async () => {
  await withServer(async (baseUrl) => {
    const email = `new-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        name: "New User",
        role: "freelancer",
        password: "super-secret-password"
      })
    });

    const createPayload = await createResponse.json();
    const created = createPayload.data;

    assert.equal(createResponse.status, 201);
    assert.equal(created.email, email);
    assert.equal(created.name, "New User");
    assert.equal(created.role, "freelancer");
    assert.equal("password" in created, false);

    const listResponse = await fetch(`${baseUrl}/api/users`);
    const listPayload = await listResponse.json();
    const stored = listPayload.data.find((user) => user.email === email);

    assert.equal(listResponse.status, 200);
    assert.ok(stored);
    assert.equal(stored.name, "New User");
    assert.equal(stored.role, "freelancer");
    assert.equal("password" in stored, false);
  });
});
