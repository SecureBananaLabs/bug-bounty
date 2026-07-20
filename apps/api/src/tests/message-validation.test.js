import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/messages with valid text returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "hello world" })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.data.text, "hello world");
  assert.ok(body.data.id.startsWith("msg_"));
  assert.ok(body.data.sentAt);

  server.close();
});

test("POST /api/messages rejects missing text", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);

  server.close();
});

test("POST /api/messages rejects empty text", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "" })
  });

  assert.equal(res.status, 400);

  server.close();
});

test("caller-supplied id is ignored", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "test", id: "hacked_id" })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.ok(body.data.id.startsWith("msg_"));
  assert.notEqual(body.data.id, "hacked_id");

  server.close();
});

test("caller-supplied sentAt is ignored", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => { server.once("listening", r); server.once("error", e); });
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "test", sentAt: "1999-01-01T00:00:00.000Z" })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.notEqual(body.data.sentAt, "1999-01-01T00:00:00.000Z");

  server.close();
});
