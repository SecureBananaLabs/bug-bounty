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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/users rejects empty user payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects invalid email payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "not-an-email",
      fullName: "Jane Client",
      role: "client"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users creates users from validated fields only", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      id: "usr_attacker",
      email: "client@example.com",
      fullName: "  Jane Client  ",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "usr_attacker");
    assert.equal(payload.data.email, "client@example.com");
    assert.equal(payload.data.fullName, "Jane Client");
    assert.equal(payload.data.role, "freelancer");
  });
});
