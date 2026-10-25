import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  listMessages,
  SelfDirectedMessageError,
  sendMessage
} from "../services/messageService.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("sendMessage rejects self-directed messages without storing them", async () => {
  const listLengthBefore = (await listMessages()).length;

  await assert.rejects(
    () =>
      sendMessage({
        senderId: "usr_123",
        receiverId: "usr_123",
        body: "hello myself"
      }),
    SelfDirectedMessageError
  );
  assert.equal((await listMessages()).length, listLengthBefore);
});

test("POST /api/messages returns 400 for self-directed messages", async () => {
  const listLengthBefore = (await listMessages()).length;
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_123",
        receiverId: "usr_123",
        body: "hello myself"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Messages require distinct sender and receiver"
    });
    assert.equal((await listMessages()).length, listLengthBefore);
  } finally {
    await close(server);
  }
});
