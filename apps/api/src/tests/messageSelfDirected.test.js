import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listMessages, SelfDirectedMessageError, sendMessage } from "../services/messageService.js";

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

test("sendMessage rejects self-directed messages without storing them", async () => {
  const beforeCount = (await listMessages()).length;

  await assert.rejects(
    () => sendMessage({ senderId: "usr_1", receiverId: "usr_1", content: "hello myself" }),
    SelfDirectedMessageError
  );

  assert.equal((await listMessages()).length, beforeCount);
});

test("POST /api/messages maps self-directed messages to HTTP 400", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_1",
        receiverId: "usr_1",
        content: "hello myself"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Messages require distinct sender and receiver"
    });
  });
});
