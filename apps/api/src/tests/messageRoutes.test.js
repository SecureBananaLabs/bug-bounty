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
    await callback(`http://127.0.0.1:${port}`);
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

test("POST /api/messages validates message creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const valid = await postMessage(baseUrl, {
      senderId: "usr_sender",
      receiverId: "usr_receiver",
      content: "Hello from sender"
    });
    const validPayload = await valid.json();

    assert.equal(valid.status, 201);
    assert.equal(validPayload.data.senderId, "usr_sender");
    assert.equal(validPayload.data.receiverId, "usr_receiver");
    assert.equal(validPayload.data.content, "Hello from sender");

    const missingSender = await postMessage(baseUrl, {
      senderId: "",
      receiverId: "usr_receiver",
      content: "Hello from sender"
    });
    const missingReceiver = await postMessage(baseUrl, {
      senderId: "usr_sender",
      receiverId: "",
      content: "Hello from sender"
    });
    const emptyContent = await postMessage(baseUrl, {
      senderId: "usr_sender",
      receiverId: "usr_receiver",
      content: ""
    });

    assert.equal(missingSender.status, 400);
    assert.equal(missingReceiver.status, 400);
    assert.equal(emptyContent.status, 400);
  });
});
