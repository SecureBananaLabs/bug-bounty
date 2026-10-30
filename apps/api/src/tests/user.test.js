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
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("Valid user creation with explicit role returns 201 with created object", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Smith",
        email: "alice@example.com",
        role: "client"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.name, "Alice Smith");
    assert.equal(payload.data.email, "alice@example.com");
    assert.equal(payload.data.role, "client");
    assert.ok(payload.data.id);
  });
});

test("Valid user creation without role defaults to 'freelancer' and returns 201", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bob Jones",
        email: "bob@example.com"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.name, "Bob Jones");
    assert.equal(payload.data.email, "bob@example.com");
    assert.equal(payload.data.role, "freelancer");
    assert.ok(payload.data.id);
  });
});

test("Missing or empty name returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    // Missing name
    const res1 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing-name@example.com" })
    });
    assert.equal(res1.status, 400);
    const payload1 = await res1.json();
    assert.equal(payload1.ok, false);
    assert.ok(payload1.issues.length > 0);

    // Empty name
    const res2 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "empty-name@example.com" })
    });
    assert.equal(res2.status, 400);
    const payload2 = await res2.json();
    assert.equal(payload2.ok, false);

    // Whitespace-only name
    const res3 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   ", email: "whitespace-name@example.com" })
    });
    assert.equal(res3.status, 400);
    const payload3 = await res3.json();
    assert.equal(payload3.ok, false);
  });
});

test("Overlong name (> 100 chars) returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A".repeat(101),
        email: "overlong-name@example.com"
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.ok(payload.issues.some((issue) => issue.message.includes("100 characters")));
  });
});

test("Missing or empty email returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    // Missing email
    const res1 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Valid Name" })
    });
    assert.equal(res1.status, 400);
    const payload1 = await res1.json();
    assert.equal(payload1.ok, false);

    // Empty email
    const res2 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Valid Name", email: "" })
    });
    assert.equal(res2.status, 400);
    const payload2 = await res2.json();
    assert.equal(payload2.ok, false);
  });
});

test("Invalid email format returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Valid Name",
        email: "invalid-email-address"
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.ok(payload.issues.some((issue) => issue.message.includes("Invalid email format")));
  });
});

test("Overlong email (> 255 chars) returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    const longEmail = `${"a".repeat(245)}@example.com`; // 245 + 12 = 257 chars
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Valid Name",
        email: longEmail
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.ok(payload.issues.some((issue) => issue.message.includes("255 characters")));
  });
});

test("Invalid role enum returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Valid Name",
        email: "valid@example.com",
        role: "admin"
      })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.ok, false);
  });
});

test("Non-string name or email returns HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    // Non-string name
    const res1 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: 12345,
        email: "valid@example.com"
      })
    });
    assert.equal(res1.status, 400);
    const payload1 = await res1.json();
    assert.equal(payload1.ok, false);

    // Non-string email
    const res2 = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Valid Name",
        email: 98765
      })
    });
    assert.equal(res2.status, 400);
    const payload2 = await res2.json();
    assert.equal(payload2.ok, false);
  });
});

test("GET /api/users returns 200 with array", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});
