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

test("POST /api/users validates user creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const valid = await postUser(baseUrl, {
      name: "Ada Lovelace",
      email: "ada@example.com"
    });
    const validPayload = await valid.json();

    assert.equal(valid.status, 201);
    assert.equal(validPayload.data.name, "Ada Lovelace");
    assert.equal(validPayload.data.email, "ada@example.com");
    assert.equal(validPayload.data.role, "client");

    const invalidName = await postUser(baseUrl, {
      name: "",
      email: "name@example.com"
    });
    const invalidEmail = await postUser(baseUrl, {
      name: "Grace Hopper",
      email: "not-an-email"
    });
    const invalidRole = await postUser(baseUrl, {
      name: "Katherine Johnson",
      email: "katherine@example.com",
      role: "owner"
    });

    assert.equal(invalidName.status, 400);
    assert.equal(invalidEmail.status, 400);
    assert.equal(invalidRole.status, 400);
  });
});
