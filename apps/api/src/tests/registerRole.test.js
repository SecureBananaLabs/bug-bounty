import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { registerSchema } from "../validators/auth.js";

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

test("registerSchema rejects admin self-assignment", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerSchema still accepts public registration roles", () => {
  const client = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const freelancer = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  const defaulted = registerSchema.parse({
    email: "default@example.com",
    password: "password123"
  });

  assert.equal(client.role, "client");
  assert.equal(freelancer.role, "freelancer");
  assert.equal(defaulted.role, "client");
});

test("registration endpoint rejects admin self-assignment with a client error", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid registration payload"
    });
  });
});

test("admin routes reject authenticated non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Forbidden" });
  });
});

test("admin routes allow admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.flaggedAccounts, 3);
  });
});
