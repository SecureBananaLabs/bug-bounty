import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const close = () =>
    new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  return { baseUrl, close };
}

test("GET /api/messages returns 200 and list of messages", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/messages`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  } finally {
    await close();
  }
});

test("POST /api/messages with valid payload returns 201 and created message", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const payload = {
      recipientId: "user_recipient_123",
      content: "Hello, this is a valid test message."
    };
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.recipientId, payload.recipientId);
    assert.equal(json.data.content, payload.content);
    assert.ok(json.data.id);
  } finally {
    await close();
  }
});

test("POST /api/messages with missing recipientId returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const invalidPayloads = [
      { content: "Hello without recipient" },
      { recipientId: "", content: "Hello with empty recipient" }
    ];
    for (const payload of invalidPayloads) {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      assert.equal(res.status, 400);
      assert.equal(json.success, false);
      assert.equal(json.message, "Validation failed");
      assert.ok(Array.isArray(json.errors));
    }
  } finally {
    await close();
  }
});

test("POST /api/messages with empty or missing content returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const invalidPayloads = [
      { recipientId: "user_123" },
      { recipientId: "user_123", content: "" }
    ];
    for (const payload of invalidPayloads) {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      assert.equal(res.status, 400);
      assert.equal(json.success, false);
      assert.equal(json.message, "Validation failed");
      assert.ok(Array.isArray(json.errors));
    }
  } finally {
    await close();
  }
});

test("POST /api/messages with overly long content (>2000 chars) returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: "user_123",
        content: "x".repeat(2001)
      })
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.message, "Validation failed");
    assert.ok(Array.isArray(json.errors));
  } finally {
    await close();
  }
});

test("POST /api/messages with overly long recipientId (>64 chars) returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: "x".repeat(65),
        content: "Valid content"
      })
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.message, "Validation failed");
    assert.ok(Array.isArray(json.errors));
  } finally {
    await close();
  }
});
