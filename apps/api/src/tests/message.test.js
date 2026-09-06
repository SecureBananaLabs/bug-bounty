import test from "node:test";
import assert from "node:assert/strict";
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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postMessage(baseUrl, payload) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/messages rejects missing receiverId", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      senderId: "user_sender",
      body: "Hello"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid message payload" });
  });
});

test("POST /api/messages rejects blank body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      senderId: "user_sender",
      receiverId: "user_receiver",
      body: " "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid message payload" });
  });
});

test("POST /api/messages preserves generated ids over caller supplied ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      id: "msg_client",
      senderId: "user_sender",
      receiverId: "user_receiver",
      body: "Hello"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.notEqual(payload.data.id, "msg_client");
    assert.equal(payload.data.senderId, "user_sender");
    assert.equal(payload.data.receiverId, "user_receiver");
    assert.equal(payload.data.body, "Hello");
    assert.ok(payload.data.sentAt);
  });
});
