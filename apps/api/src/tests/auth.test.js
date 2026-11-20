import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register with valid client payload succeeds with 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "client@example.com", password: "securePassword123", role: "client" })
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.email, "client@example.com");
    assert.equal(data.data.role, "client");
    assert.ok(data.data.token);
  });
});

test("POST /api/auth/register with valid freelancer payload succeeds with 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "freelancer@example.com", password: "securePassword123", role: "freelancer" })
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.email, "freelancer@example.com");
    assert.equal(data.data.role, "freelancer");
    assert.ok(data.data.token);
  });
});

test("POST /api/auth/register with self-assigned admin role rejects with 400 (Privilege Escalation Guard)", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hacker@evil.com", password: "securePassword123", role: "admin" })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Administrative role cannot be self-assigned/i);
  });
});

test("POST /api/auth/register with invalid email rejects with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "securePassword123" })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Invalid email format/i);
  });
});

test("POST /api/auth/register with short password (< 8 chars) rejects with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "short" })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /at least 8 characters/i);
  });
});

test("POST /api/auth/login with valid credentials succeeds with 200", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "securePassword123" })
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.email, "user@example.com");
    assert.ok(data.data.token);
  });
});
