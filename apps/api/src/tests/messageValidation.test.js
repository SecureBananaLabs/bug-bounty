import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validMessage = {
  senderId: "usr_sender",
  receiverId: "usr_receiver",
  body: "I can start the project on Monday."
};

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

async function postMessage(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/messages rejects empty message payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postMessage(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid message payload" });
  });
});

test("POST /api/messages rejects blank message bodies", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postMessage(baseUrl, {
      ...validMessage,
      body: "   "
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid message payload" });
  });
});

test("POST /api/messages rejects missing receiver ids", async () => {
  await withServer(async (baseUrl) => {
    const { receiverId, ...messageWithoutReceiver } = validMessage;
    const { response, payload } = await postMessage(baseUrl, messageWithoutReceiver);

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid message payload" });
  });
});

test("POST /api/messages creates messages from validated fields only", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postMessage(baseUrl, {
      id: "msg_attacker",
      ...validMessage,
      body: `  ${validMessage.body}  `
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "msg_attacker");
    assert.equal(payload.data.senderId, validMessage.senderId);
    assert.equal(payload.data.receiverId, validMessage.receiverId);
    assert.equal(payload.data.body, validMessage.body);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
