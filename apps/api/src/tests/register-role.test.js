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

async function postRegister(baseUrl, payload) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/auth/register defaults public registrations to client role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "client@example.com",
      password: "password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "client");
  });
});

test("POST /api/auth/register allows freelancer self-registration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "freelancer");
  });
});

test("POST /api/auth/register rejects admin self-registration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid registration payload"
    });
  });
});
