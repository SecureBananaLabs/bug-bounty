import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser } from "../services/authService.js";

test("POST /api/auth/register allows client and freelancer roles", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  for (const role of ["client", "freelancer"]) {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test_${role}@example.com`,
        password: "password123",
        role
      })
    });

    const payload = await res.json();
    assert.equal(res.status, 201);
    assert.equal(payload.data.role, role);
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin_test@example.com",
      password: "password123",
      role: "admin"
    })
  });

  assert.equal(res.status, 400);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("registerUser service throws error on admin role", async () => {
  await assert.rejects(
    async () => {
      await registerUser({ email: "admin@example.com", role: "admin" });
    },
    {
      name: "Error",
      message: "Admin role cannot be self-assigned"
    }
  );
});
