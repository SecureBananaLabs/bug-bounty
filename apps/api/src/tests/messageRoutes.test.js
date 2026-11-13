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

test("POST /api/messages returns 400 for self-directed messages", async () => {
  await withServer(async (baseUrl) => {
    const userId = `usr_self_${Date.now()}-${Math.random()}`;
    const payload = {
      senderId: userId,
      receiverId: userId,
      body: "Hello myself"
    };

    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const responsePayload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(responsePayload, {
      success: false,
      message: `User ${userId} cannot send a message to themselves`
    });

    const listResponse = await fetch(`${baseUrl}/api/messages`);
    const listPayload = await listResponse.json();
    const matchingMessages = listPayload.data.filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );

    assert.equal(matchingMessages.length, 0);
  });
});
