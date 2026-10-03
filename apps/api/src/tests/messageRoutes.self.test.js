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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages rejects self-directed messages", async () => {
  await withServer(async (baseUrl) => {
    const beforeResponse = await fetch(`${baseUrl}/api/messages`);
    const beforePayload = await beforeResponse.json();

    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_123",
        receiverId: "usr_123",
        body: "hello myself",
      }),
    });
    const payload = await response.json();

    const afterResponse = await fetch(`${baseUrl}/api/messages`);
    const afterPayload = await afterResponse.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Messages require distinct sender and receiver");
    assert.equal(afterPayload.data.length, beforePayload.data.length);
  });
});
