import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerSchema } from "../validators/auth.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("registerSchema only accepts client and freelancer roles", () => {
  const client = registerSchema.safeParse({
    email: "ana@example.com",
    password: "super-secret",
    role: "client"
  });
  const freelancer = registerSchema.safeParse({
    email: "ben@example.com",
    password: "super-secret",
    role: "freelancer"
  });
  const admin = registerSchema.safeParse({
    email: "eve@example.com",
    password: "super-secret",
    role: "admin"
  });
  const defaulted = registerSchema.parse({
    email: "cai@example.com",
    password: "super-secret"
  });

  assert.equal(client.success, true);
  assert.equal(freelancer.success, true);
  assert.equal(admin.success, false);
  assert.equal(defaulted.role, "client");
});

test("POST /api/auth/register rejects an admin role with 400", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "eve@example.com",
      password: "super-secret",
      role: "admin"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "role is invalid");

  await close(server);
});

test("POST /api/auth/register creates a freelancer with a token", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "ben@example.com",
      password: "super-secret",
      role: "freelancer"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.role, "freelancer");
  assert.equal(typeof payload.data.token, "string");
  assert.match(payload.data.id, /^usr_/);

  await close(server);
});
