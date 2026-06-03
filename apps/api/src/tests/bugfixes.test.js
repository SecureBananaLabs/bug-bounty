import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

// #3989: Unknown API routes should use JSON error responses
test("GET /api/nonexistent-route returns JSON 404", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/nonexistent-route`);
    const payload = await response.json();
    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Not found");
  });
});

test("GET /api/also-bad returns JSON 404", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/also-bad`);
    const payload = await response.json();
    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
  });
});

// #4005: Message service should keep ids server-owned
test("POST /api/messages should ignore client-set id", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const r1 = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello", id: "msg_fake", sentAt: "1999-01-01" })
    });
    const p1 = await r1.json();
    assert.equal(r1.status, 201);
    assert.equal(p1.success, true);
    assert.ok(p1.data.id);
    assert.ok(p1.data.id.startsWith("msg_"));
    assert.notEqual(p1.data.id, "msg_fake");
    assert.ok(p1.data.sentAt);
    assert.notEqual(p1.data.sentAt, "1999-01-01");
  });
});

test("POST /api/messages multiple calls return unique ids", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const r1 = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "first" })
    });
    const r2 = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "second" })
    });
    const p1 = await r1.json();
    const p2 = await r2.json();

    assert.equal(r1.status, 201);
    assert.equal(r2.status, 201);
    assert.equal(p1.success, true);
    assert.equal(p2.success, true);
    assert.ok(p1.data.id.startsWith("msg_"));
    assert.ok(p2.data.id.startsWith("msg_"));
    assert.notEqual(p1.data.id, p2.data.id);
  });
});

// #3999: Login should reject unknown or wrong credentials
test("POST /api/auth/login should reject unregistered email", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@test.com", password: "password123" })
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/auth/login should reject wrong password", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    // First register
    await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", password: "password123", role: "client" })
    });

    // Then try wrong password
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", password: "wrongpassword" })
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
  });
});

test("POST /api/auth/login should accept correct credentials", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    // First register
    await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "valid@test.com", password: "password123", role: "freelancer" })
    });

    // Then login with correct credentials
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "valid@test.com", password: "password123" })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);
    assert.equal(payload.data.email, "valid@test.com");
  });
});

// #3996: Review endpoint should reject ratings outside 1-5
test("POST /api/reviews should reject rating 0", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 0, comment: "bad" })
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/reviews should reject rating 6", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 6, comment: "too high" })
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews should reject non-integer rating", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 3.5, comment: "half star" })
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews should reject missing rating", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "no rating" })
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews should accept valid rating 1-5", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 3, comment: "ok" })
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 3);
  });
});

// #3992: Notification should reject missing or blank messages
test("POST /api/notifications should reject missing message", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/notifications should reject blank message", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" })
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/notifications should reject whitespace-only message", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " })
    });
    assert.equal(response.status, 400);
  });
});

test("POST /api/notifications should accept valid message", async () => {
  const app = createApp();
  await withServer(app, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello world", recipientId: "usr_1" })
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.message, "Hello world");
    assert.equal(payload.data.read, false);
  });
});
