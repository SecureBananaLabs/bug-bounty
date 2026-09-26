import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(callback) {
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
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRegister(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/register defaults public users to client role", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "client@example.com",
      password: "password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "client");
  });
});

test("POST /api/auth/register allows freelancer self-service role", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "freelancer");
  });
});

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.issues[0].path[0], "role");
  });
});
