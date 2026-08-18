import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/messages returns 400 when receiverId is missing", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "u1", body: "hello" })
  });

  assert.equal(res.status, 400);
  const payload = await res.json();
  assert.equal(payload.success, false);

  await closeServer(server);
});

test("POST /api/messages returns 400 when body is blank", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "u1", receiverId: "u2", body: "" })
  });

  assert.equal(res.status, 400);
  const payload = await res.json();
  assert.equal(payload.success, false);

  await closeServer(server);
});

test("POST /api/messages ignores caller-supplied id", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "u1", receiverId: "u2", body: "hi", id: "evil_id_123" })
  });

  assert.equal(res.status, 201);
  const payload = await res.json();
  assert.ok(payload.data.id.startsWith("msg_"));
  assert.notEqual(payload.data.id, "evil_id_123");

  await closeServer(server);
});

test("POST /api/messages succeeds with valid payload", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "u1", receiverId: "u2", body: "hello world" })
  });

  assert.equal(res.status, 201);
  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("msg_"));
  assert.equal(payload.data.senderId, "u1");
  assert.equal(payload.data.receiverId, "u2");
  assert.equal(payload.data.body, "hello world");

  await closeServer(server);
});
