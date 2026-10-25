import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { validateCreateMessage } from "../validators/message.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("validator requires senderId, recipientId and content", () => {
  const missing = validateCreateMessage({ senderId: "usr_1", recipientId: "usr_2" });
  const whitespace = validateCreateMessage({
    senderId: "usr_1",
    recipientId: "usr_2",
    content: "   "
  });
  const valid = validateCreateMessage({
    senderId: " usr_1 ",
    recipientId: "usr_2",
    content: " Hello there "
  });

  assert.equal(missing.valid, false);
  assert.equal(missing.message, "content must be a non-empty string");
  assert.equal(whitespace.valid, false);
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.data, {
    senderId: "usr_1",
    recipientId: "usr_2",
    content: "Hello there"
  });
});

test("POST /api/messages rejects a payload without content", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ senderId: "usr_1", recipientId: "usr_2" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await close(server);
});

test("POST /api/messages stores a complete message", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      senderId: "usr_1",
      recipientId: "usr_2",
      content: "Hello there"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.content, "Hello there");
  assert.equal(typeof payload.data.sentAt, "string");

  await close(server);
});
