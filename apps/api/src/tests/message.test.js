import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function postJson(port, path, data) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  return { status: res.status, body };
}

test("POST /api/messages accepts valid payload", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { content: "Hello", recipientId: "user123", jobId: "job456" };
  const { status, body } = await postJson(port, "/api/messages", payload);
  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.content, "Hello");
  assert.equal(body.data.recipientId, "user123");
  assert.equal(body.data.jobId, "job456");
  assert.ok(body.data.id);
  assert.ok(body.data.sentAt);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/messages rejects missing fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const { status, body } = await postJson(port, "/api/messages", {});
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/messages rejects extra fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { content: "Hello", recipientId: "user123", jobId: "job456", role: "admin" };
  const { status, body } = await postJson(port, "/api/messages", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/messages rejects system fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { content: "Hello", recipientId: "user123", jobId: "job456", id: "fake_id", sentAt: "2026-01-01" };
  const { status, body } = await postJson(port, "/api/messages", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});
