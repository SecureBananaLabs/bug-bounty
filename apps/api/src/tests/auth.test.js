import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

beforeEach(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
});

test("Valid registration with default role returns 201 with role client", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.email, "user@example.com");
  assert.equal(data.data.role, "client");
  assert.ok(data.data.token);
});

test("Valid registration with freelancer role returns 201", async () => {
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
  assert.equal(data.data.email, "freelancer@example.com");
  assert.equal(data.data.role, "freelancer");
  assert.ok(data.data.token);
});

test("Registration attempting role: admin returns HTTP 400 (preventing privilege escalation)", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin_wannabe@example.com",
      password: "password123",
      role: "admin"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.some((i) => i.path.includes("role")));
});

test("Registration with password > 128 chars returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "toolong@example.com",
      password: "A".repeat(129)
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.some((i) => i.path.includes("password")));
});

test("Registration with password < 8 chars returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "tooshort@example.com",
      password: "short"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.some((i) => i.path.includes("password")));
});

test("Invalid email returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "not-a-valid-email",
      password: "password123"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.some((i) => i.path.includes("email")));
});

test("Valid login returns 200", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.email, "user@example.com");
  assert.ok(data.data.token);
});

test("Login with invalid password returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "bad"
    })
  });
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.ok, false);
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.some((i) => i.path.includes("password")));
});
