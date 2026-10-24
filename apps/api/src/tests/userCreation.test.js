import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createApp } from "../app.js";
import { createUser } from "../services/userService.js";

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

async function postJson(baseUrl, body) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST /api/users persists only a valid supported user payload", async () => {
  await withServer(async (baseUrl) => {
    const email = `valid-${randomUUID()}@example.com`;

    const response = await postJson(baseUrl, {
      email,
      fullName: "Ada Lovelace",
      bio: "Systems engineer",
      role: "client",
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, email);
    assert.equal(payload.data.fullName, "Ada Lovelace");
    assert.equal(payload.data.bio, "Systems engineer");
    assert.equal(payload.data.role, "client");
    assert.match(payload.data.id, /^usr_\d+$/);
  });
});

test("POST /api/users rejects invalid email and missing fullName", async () => {
  await withServer(async (baseUrl) => {
    const invalidEmail = await postJson(baseUrl, {
      email: "not-an-email",
      fullName: "Ada Lovelace",
    });

    assert.equal(invalidEmail.status, 400);
    assert.deepEqual(await invalidEmail.json(), {
      success: false,
      message: "Invalid user payload",
    });

    const missingFullName = await postJson(baseUrl, {
      email: `missing-name-${randomUUID()}@example.com`,
    });

    assert.equal(missingFullName.status, 400);
    assert.deepEqual(await missingFullName.json(), {
      success: false,
      message: "Invalid user payload",
    });
  });
});

test("POST /api/users rejects unknown fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, {
      email: `unknown-${randomUUID()}@example.com`,
      fullName: "Ada Lovelace",
      isAdmin: true,
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Invalid user payload",
    });
  });
});

test("POST /api/users rejects plaintext password and never persists it", async () => {
  await withServer(async (baseUrl) => {
    const email = `password-${randomUUID()}@example.com`;

    const response = await postJson(baseUrl, {
      email,
      fullName: "Ada Lovelace",
      password: "plaintext-secret",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Invalid user payload",
    });

    const usersResponse = await fetch(`${baseUrl}/api/users`);
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(
      usersPayload.data.some((user) => user.email === email),
      false,
    );
  });
});

test("createUser allowlists persisted properties as a service-level safeguard", async () => {
  const user = await createUser({
    email: `service-${randomUUID()}@example.com`,
    fullName: "Grace Hopper",
    bio: "Compiler pioneer",
    role: "client",
    password: "plaintext-secret",
    isAdmin: true,
  });

  assert.deepEqual(Object.keys(user).sort(), [
    "bio",
    "email",
    "fullName",
    "id",
    "role",
  ]);
  assert.equal("password" in user, false);
  assert.equal("isAdmin" in user, false);
});
