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

async function postUser(baseUrl, body) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid user payload");
  });
});

test("POST /api/users rejects client-controlled ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      id: "usr_attacker",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "client"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid user payload");
  });
});

test("POST /api/users rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid user payload");
  });
});

test("POST /api/users creates validated users with server-owned ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      name: "  Ada Lovelace  ",
      email: "ada@example.com"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.name, "Ada Lovelace");
    assert.equal(payload.data.email, "ada@example.com");
    assert.equal(payload.data.role, "client");
  });
});
