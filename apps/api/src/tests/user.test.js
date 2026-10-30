import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/users returns 200", async () => {
  const res = await fetch(`${baseUrl}/api/users`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("POST /api/users with valid data returns 201 and created user", async () => {
  const payload = {
    name: "Alice Developer",
    email: "alice@example.com",
    role: "freelancer"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.name, payload.name);
  assert.equal(body.data.email, payload.email);
  assert.equal(body.data.role, payload.role);
  assert.ok(body.data.id);
});

test("POST /api/users with missing name returns 400", async () => {
  const payload = {
    email: "noname@example.com",
    role: "client"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("name")));
});

test("POST /api/users with empty name returns 400", async () => {
  const payload = {
    name: "",
    email: "emptyname@example.com",
    role: "client"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("name")));
});

test("POST /api/users with invalid email format returns 400", async () => {
  const payload = {
    name: "Bad Email",
    email: "invalid-email-format",
    role: "client"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("email")));
});

test("POST /api/users with excessive name length (>100) returns 400", async () => {
  const payload = {
    name: "a".repeat(101),
    email: "longname@example.com",
    role: "client"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("name")));
});

test("POST /api/users with invalid role enum returns 400", async () => {
  const payload = {
    name: "Invalid Role",
    email: "invalidrole@example.com",
    role: "admin"
  };

  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.ok(body.errors.some((e) => e.path.includes("role")));
});
