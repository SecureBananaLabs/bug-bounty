import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/messages ignores client-supplied id", async () => {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "msg_attacker_controlled",
      content: "hello",
      recipientId: "usr_123"
    })
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.data.id.startsWith("msg_"), "id should be server-generated");
  assert.notEqual(body.data.id, "msg_attacker_controlled", "client-supplied id should be ignored");

  await close(server);
});

test("POST /api/messages returns server-generated id and sentAt", async () => {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "test message",
      recipientId: "usr_456"
    })
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.data.id, "should have an id");
  assert.ok(body.data.sentAt, "should have sentAt");
  assert.equal(body.data.content, "test message");
  assert.equal(body.data.recipientId, "usr_456");

  await close(server);
});
