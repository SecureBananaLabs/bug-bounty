import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const BASE = "/api";

async function setup() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}`;
  return { server, url };
}

async function teardown(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

// ── Registration: role self-assignment ──────────────────────────────────

test("POST /auth/register rejects admin role in request body", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "evil@test.com", password: "password123", role: "admin" })
    });
    // Zod should reject "admin" since it's not in the enum
    assert.equal(res.status, 400, "Expected 400 when registering with admin role");
  } finally {
    await teardown(server);
  }
});

test("POST /auth/register with client role succeeds", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "client@test.com", password: "password123", role: "client" })
    });
    assert.equal(res.status, 201, "Expected 201 for valid client registration");
    const body = await res.json();
    assert.equal(body.data.role, "client");
  } finally {
    await teardown(server);
  }
});

test("POST /auth/register with freelancer role succeeds", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "freelancer@test.com", password: "password123", role: "freelancer" })
    });
    assert.equal(res.status, 201, "Expected 201 for valid freelancer registration");
    const body = await res.json();
    assert.equal(body.data.role, "freelancer");
  } finally {
    await teardown(server);
  }
});

test("POST /auth/register defaults role to client when omitted", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "default@test.com", password: "password123" })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.role, "client", "Default role should be client");
  } finally {
    await teardown(server);
  }
});

// ── User creation: role self-assignment ─────────────────────────────────

test("POST /users rejects admin role in request body", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "evil2@test.com", password: "password123", role: "admin" })
    });
    // createUserSchema should reject "admin"
    assert.equal(res.status, 400, "Expected 400 when creating user with admin role");
  } finally {
    await teardown(server);
  }
});

test("POST /users with client role succeeds", async () => {
  const { server, url } = await setup();
  try {
    const res = await fetch(`${url}${BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "good@test.com", password: "password123", role: "client" })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.role, "client");
  } finally {
    await teardown(server);
  }
});

// ── Service-layer defense-in-depth ──────────────────────────────────────

test("authService.registerUser forces client role when admin is passed", async () => {
  // Directly test the service layer as defense-in-depth
  const { registerUser } = await import("../services/authService.js");
  const result = await registerUser({ email: "direct@test.com", password: "x", role: "admin" });
  assert.equal(result.role, "client", "Service should force client role even if admin slips through");
});

test("userService.createUser forces client role when admin is passed", async () => {
  const { createUser } = await import("../services/userService.js");
  const result = await createUser({ email: "direct2@test.com", password: "x", role: "admin" });
  assert.equal(result.role, "client", "Service should force client role even if admin slips through");
});
