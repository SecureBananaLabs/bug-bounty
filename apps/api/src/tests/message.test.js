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
  }
});

test("Test 1: Valid message creation returns 201 with created object", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "user_42",
      content: "Hello! This is a test message."
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id);
  assert.equal(payload.data.recipientId, "user_42");
  assert.equal(payload.data.content, "Hello! This is a test message.");
  assert.ok(payload.data.sentAt);
});

test("Test 2: Missing recipientId returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "Message with no recipient"
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("recipientId")));
});

test("Test 3: Overly long recipientId (> 64 chars) returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "a".repeat(65),
      content: "Valid content"
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("recipientId")));
});

test("Test 4: Empty message content returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "user_42",
      content: "   "
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("content")));
});

test("Test 5: Message content exceeding 2000 chars returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "user_42",
      content: "a".repeat(2001)
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("content")));
});

test("Test 6: Non-string recipientId returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: 12345,
      content: "Valid content"
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("recipientId")));
});

test("Test 7: Non-string content returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "user_42",
      content: { text: "not a string" }
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.issues));
  assert.ok(payload.issues.some((issue) => issue.path.includes("content")));
});

test("Test 8: GET /api/messages returns 200 with array of messages", async () => {
  const response = await fetch(`${baseUrl}/api/messages`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(Array.isArray(payload.data));
});
