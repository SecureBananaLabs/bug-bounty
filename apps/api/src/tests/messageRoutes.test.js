import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../app.js";

async function withServer(callback) {
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

async function postMessage(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/messages rejects blank content", async () => {
  await withServer(async (port) => {
    const response = await postMessage(port, {
      recipientId: "usr_123",
      content: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid message payload"
    });
  });
});

test("POST /api/messages requires a recipient id", async () => {
  await withServer(async (port) => {
    const response = await postMessage(port, { content: "Hello" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid message payload"
    });
  });
});

test("POST /api/messages accepts valid content", async () => {
  await withServer(async (port) => {
    const response = await postMessage(port, {
      recipientId: "usr_123",
      content: " Hello "
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_/);
    assert.equal(payload.data.recipientId, "usr_123");
    assert.equal(payload.data.content, "Hello");
    assert.ok(Date.parse(payload.data.sentAt));
  });
});
