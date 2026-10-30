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
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("Valid registration with default 'client' role returns 201", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "client@example.com",
      password: "password123"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.role, "client");
  assert.ok(data.data.token);
});

test("Valid registration with 'freelancer' role returns 201", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.role, "freelancer");
  assert.ok(data.data.token);
});

test("Registration attempting to pass role 'admin' returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("Registration with password < 8 chars returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "short@example.com",
      password: "short"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("Registration with password > 128 chars returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "long@example.com",
      password: "a".repeat(129)
    })
  });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("Registration with invalid email returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "invalid-email",
      password: "password123"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("Valid login returns 200 with token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "valid@example.com",
      password: "password123"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.token);
});

test("Login with invalid email returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      password: "password123"
    })
  });
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("Valid OAuth provider ('google', 'github', 'gitlab') returns 200", async () => {
  for (const provider of ["google", "github", "gitlab"]) {
    const res = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.provider, provider);
    assert.equal(data.data.status, "callback-received");
  }
});

test("Unsupported OAuth provider returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/oauth/unsupported/callback`);
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
});

test("POST /api/auth/refresh returns 200 with token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST"
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.token);
});
