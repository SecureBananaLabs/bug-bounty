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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validMessage = {
  content: "Hello from the API",
  recipientId: "usr_receiver",
  senderId: "usr_sender"
};

test("POST /api/messages rejects empty, missing, or oversized message payloads", async () => {
  await withServer(async (port) => {
    const invalidPayloads = [
      { ...validMessage, content: "" },
      { content: "Hello from the API", recipientId: "" },
      { ...validMessage, content: "x".repeat(5001) }
    ];

    for (const payload of invalidPayloads) {
      const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
    }
  });
});

test("POST /api/messages accepts valid message payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validMessage)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.content, validMessage.content);
    assert.equal(payload.data.recipientId, validMessage.recipientId);
    assert.equal(payload.data.senderId, validMessage.senderId);
    assert.match(payload.data.id, /^msg_/);
  });
});
