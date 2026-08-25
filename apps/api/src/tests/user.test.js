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

async function postUser(baseUrl, payload) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

test("POST /api/users accepts valid user creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "alice@example.com",
      name: "Alice"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "alice@example.com");
    assert.equal(payload.data.name, "Alice");
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.role, undefined);
  });
});

test("POST /api/users rejects missing and invalid required fields", async () => {
  await withServer(async (baseUrl) => {
    const missingName = await postUser(baseUrl, {
      email: "alice@example.com"
    });
    const missingPayload = await missingName.json();

    assert.equal(missingName.status, 400);
    assert.equal(missingPayload.success, false);
    assert.equal(missingPayload.message, "Invalid user request");
    assert.ok(missingPayload.issues.some((issue) => issue.path.includes("name")));

    const badEmail = await postUser(baseUrl, {
      email: "not-an-email",
      name: "Alice"
    });
    const badPayload = await badEmail.json();

    assert.equal(badEmail.status, 400);
    assert.equal(badPayload.success, false);
    assert.ok(badPayload.issues.some((issue) => issue.path.includes("email")));
  });
});

test("POST /api/users ignores caller-supplied system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "alice@example.com",
      name: "Alice",
      id: "usr_attacker",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "alice@example.com");
    assert.equal(payload.data.name, "Alice");
    assert.match(payload.data.id, /^usr_/);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.role, undefined);
  });
});
