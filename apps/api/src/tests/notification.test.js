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
  return { server, port: server.address().port };
}

function closeServer(server) {
  server.closeAllConnections();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/notifications returns 400 when title is missing", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", body: "hello" })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await closeServer(server);
});

test("POST /api/notifications returns 400 when body is blank", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", title: "hi", body: "" })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await closeServer(server);
});

test("POST /api/notifications ignores caller-supplied id", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", title: "hi", body: "yo", id: "ntf_evil_123" })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.notEqual(payload.data.id, "ntf_evil_123");
  assert.ok(payload.data.id.startsWith("ntf_"));

  await closeServer(server);
});

test("POST /api/notifications ignores caller-supplied read", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", title: "hi", body: "yo", read: true })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.data.read, false);

  await closeServer(server);
});

test("POST /api/notifications creates a notification with valid payload", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", title: "hello", body: "world" })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.userId, "u1");
  assert.equal(payload.data.title, "hello");
  assert.equal(payload.data.body, "world");
  assert.equal(payload.data.read, false);
  assert.ok(payload.data.id.startsWith("ntf_"));

  await closeServer(server);
});
