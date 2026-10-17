import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postMessage(baseUrl, body) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/messages rejects an empty payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid message payload");
  });
});

test("POST /api/messages rejects blank message content", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      senderId: "usr_sender",
      recipientId: "usr_recipient",
      content: "   "
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/messages stores a valid message payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      senderId: "usr_sender",
      recipientId: "usr_recipient",
      content: "The proposal is ready for review."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_/);
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.content, "The proposal is ready for review.");
    assert.equal(typeof payload.data.sentAt, "string");
  });
});
