import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/messages with valid payload returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: "user_123",
      recipientId: "user_456",
      content: "Hello, this is a test message"
    })
  });

  assert.equal(res.status, 201, "Should return 201 for valid message");
  const data = await res.json();
  assert.equal(data.success, true, "Should return success response");
  assert.ok(data.data.id, "Should include generated id");
  assert.equal(data.data.senderId, "user_123", "Should preserve senderId");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/messages with empty body returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400, "Should return 400 for empty body");
  const data = await res.json();
  assert.equal(data.status, "error", "Should return error status");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/messages with blank content returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: "user_123",
      recipientId: "user_456",
      content: "   "
    })
  });

  assert.equal(res.status, 400, "Should return 400 for blank content");
  const data = await res.json();
  assert.equal(data.status, "error", "Should return error status");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/messages with missing senderId returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: "user_456",
      content: "Hello"
    })
  });

  assert.equal(res.status, 400, "Should return 400 for missing senderId");
  const data = await res.json();
  assert.ok(data.errors.some(e => e.field === "senderId"), "Should have senderId error");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/messages with non-string fields returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: 12345,
      recipientId: "user_456",
      content: "Hello"
    })
  });

  assert.equal(res.status, 400, "Should return 400 for non-string senderId");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
