import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, body) {
  return fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid user payload"
    });
  });
});

test("POST /api/users keeps id server-controlled", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      id: "usr_attacker",
      email: "user@example.com",
      name: "Example User",
      role: "client"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.email, "user@example.com");
    assert.equal(payload.data.name, "Example User");
    assert.equal(payload.data.role, "client");
  });
});

test("POST /api/users defaults role to client", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUser(baseUrl, {
      email: "default-role@example.com",
      name: "Default Role"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_/);
    assert.equal(payload.data.email, "default-role@example.com");
    assert.equal(payload.data.name, "Default Role");
    assert.equal(payload.data.role, "client");
  });
});
