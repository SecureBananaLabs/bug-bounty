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

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("invalid auth registration payloads return validation errors", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      email: "not-an-email",
      password: "short"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("email")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("password")));
  });
});

test("valid auth registration payloads keep the success path", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      email: "client@example.com",
      password: "valid-password",
      role: "client"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "client@example.com");
    assert.equal(payload.data.role, "client");
    assert.equal(typeof payload.data.token, "string");
  });
});
