import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers
    }
  });

  return { response, payload: await response.json() };
}

test("POST /api/messages rejects empty and malformed payloads", async () => {
  await withServer(async (baseUrl) => {
    const before = await requestJson(`${baseUrl}/api/messages`);
    const invalidPayloads = [
      {},
      { senderId: "", recipientId: "usr_2", content: "Hello" },
      { senderId: "usr_1", recipientId: " ", content: "Hello" },
      { senderId: "usr_1", recipientId: "usr_2", content: " " },
      { senderId: 123, recipientId: "usr_2", content: "Hello" },
      { senderId: "usr_1", recipientId: "usr_2", content: false }
    ];

    for (const payload of invalidPayloads) {
      const result = await requestJson(`${baseUrl}/api/messages`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      assert.equal(result.response.status, 400);
      assert.deepEqual(result.payload, { success: false, message: "Invalid message payload" });
    }

    const after = await requestJson(`${baseUrl}/api/messages`);
    assert.equal(after.payload.data.length, before.payload.data.length);
  });
});

test("POST /api/messages accepts valid message creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const result = await requestJson(`${baseUrl}/api/messages`, {
      method: "POST",
      body: JSON.stringify({
        senderId: "usr_1",
        recipientId: "usr_2",
        content: "Hello"
      })
    });

    assert.equal(result.response.status, 201);
    assert.equal(result.payload.success, true);
    assert.match(result.payload.data.id, /^msg_/);
    assert.equal(result.payload.data.senderId, "usr_1");
    assert.equal(result.payload.data.recipientId, "usr_2");
    assert.equal(result.payload.data.content, "Hello");
    assert.equal(typeof result.payload.data.sentAt, "string");
  });
});
