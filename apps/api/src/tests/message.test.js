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

  const { port } = server.address();
  try {
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

test("POST /api/messages rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid message payload"
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
    assert.equal(payload.success, false);
  });
});

test("POST /api/messages accepts valid message payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      body: "Hello, I can start tomorrow.",
      senderId: "usr_sender",
      receiverId: "usr_receiver"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_/);
    assert.equal(payload.data.body, "Hello, I can start tomorrow.");
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.receiverId, "usr_receiver");
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
