import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postMessage(baseUrl, payload) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/messages rejects missing message fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, { body: "Hello" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "body, senderId, and receiverId are required"
    });
  });
});

test("POST /api/messages rejects blank message bodies", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      body: "   ",
      senderId: "usr_sender",
      receiverId: "usr_receiver"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "body, senderId, and receiverId are required"
    });
  });
});

test("POST /api/messages accepts a valid message payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      body: "Project update is ready",
      senderId: "usr_sender",
      receiverId: "usr_receiver"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.body, "Project update is ready");
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.receiverId, "usr_receiver");
    assert.match(payload.data.id, /^msg_/);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
