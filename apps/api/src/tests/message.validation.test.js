import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listMessages, resetMessages } from "../services/messageService.js";

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

test("POST /api/messages rejects payloads without receiverId", async () => {
  resetMessages();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "user_1",
        body: "Hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "receiverId is required"
    });
    assert.deepEqual(await listMessages(), []);
  });
});

test("POST /api/messages rejects payloads with a blank body", async () => {
  resetMessages();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "user_1",
        receiverId: "user_2",
        body: "   "
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "body is required"
    });
    assert.deepEqual(await listMessages(), []);
  });
});

test("POST /api/messages preserves the generated message id", async () => {
  resetMessages();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "client_supplied_id",
        senderId: "user_1",
        receiverId: "user_2",
        body: "Hello"
      })
    });
    const payload = await response.json();
    const [message] = await listMessages();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_/);
    assert.notEqual(payload.data.id, "client_supplied_id");
    assert.match(message.id, /^msg_/);
    assert.notEqual(message.id, "client_supplied_id");
    assert.equal(message.senderId, "user_1");
    assert.equal(message.receiverId, "user_2");
    assert.equal(message.body, "Hello");
  });
});
