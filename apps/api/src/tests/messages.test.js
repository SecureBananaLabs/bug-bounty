import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postMessage(port, payload) {
  return fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

test("POST /api/messages rejects missing message content", async () => {
  await withApiServer(async (port) => {
    const response = await postMessage(port, {
      senderId: "usr_sender",
      recipientId: "usr_recipient"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid message payload");
  });
});

test("POST /api/messages rejects whitespace-only message content", async () => {
  await withApiServer(async (port) => {
    const response = await postMessage(port, {
      senderId: "usr_sender",
      recipientId: "usr_recipient",
      content: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid message payload");
  });
});

test("POST /api/messages accepts valid message payload", async () => {
  await withApiServer(async (port) => {
    const response = await postMessage(port, {
      senderId: "usr_sender",
      recipientId: "usr_recipient",
      content: "Hello, this message has all required fields."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.content, "Hello, this message has all required fields.");
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
