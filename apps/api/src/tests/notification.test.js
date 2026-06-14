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

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/notifications creates notification with server-generated id and read=false", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test notification", message: "Hello" }),
  });
  const payload = await res.json();

  assert.equal(res.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("ntf_"), "id should be server-generated");
  assert.equal(payload.data.read, false, "read should default to false");
  assert.equal(payload.data.title, "Test notification");

  await stopServer(server);
});

test("POST /api/notifications ignores caller-supplied id", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "injected_id",
      title: "Injection attempt",
    }),
  });
  const payload = await res.json();

  assert.equal(res.status, 201);
  assert.ok(payload.data.id.startsWith("ntf_"), "server id should override caller id");
  assert.notEqual(payload.data.id, "injected_id", "caller id must be ignored");

  await stopServer(server);
});

test("POST /api/notifications ignores caller-supplied read state", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      read: true,
      title: "Read injection attempt",
    }),
  });
  const payload = await res.json();

  assert.equal(res.status, 201);
  assert.equal(payload.data.read, false, "read must always be false for new notifications");

  await stopServer(server);
});

test("POST /api/notifications handles empty body gracefully", async () => {
  const server = await startServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const payload = await res.json();

  assert.equal(res.status, 201);
  assert.ok(payload.data.id.startsWith("ntf_"));
  assert.equal(payload.data.read, false);

  await stopServer(server);
});
