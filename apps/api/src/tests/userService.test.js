import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createUser, listUsers } from "../services/userService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createUser does not store or return submitted passwords", async () => {
  const email = `private-${Date.now()}@example.com`;

  const created = await createUser({
    email,
    fullName: "Private User",
    password: "super-secret-password"
  });

  assert.equal(Object.hasOwn(created, "password"), false);
  assert.equal(created.email, email);
  assert.equal(created.fullName, "Private User");

  const users = await listUsers();
  const stored = users.find((user) => user.email === email);

  assert.ok(stored);
  assert.equal(Object.hasOwn(stored, "password"), false);
  assert.equal(stored.fullName, "Private User");
});

test("user API does not expose submitted passwords", async () => {
  const email = `api-private-${Date.now()}@example.com`;

  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        fullName: "API Private User",
        password: "super-secret-password"
      })
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(Object.hasOwn(created.data, "password"), false);
    assert.equal(created.data.email, email);

    const listResponse = await fetch(`${baseUrl}/api/users`);
    const listPayload = await listResponse.json();
    const stored = listPayload.data.find((user) => user.email === email);

    assert.equal(listResponse.status, 200);
    assert.ok(stored);
    assert.equal(Object.hasOwn(stored, "password"), false);
    assert.equal(stored.fullName, "API Private User");
  });
});
