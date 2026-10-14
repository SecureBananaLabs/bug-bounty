import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const messagePayload = {
  id: "msg_client_controlled",
  senderId: "usr_sender",
  receiverId: "usr_receiver",
  content: "Focused delivery update",
  sentAt: "1999-01-01T00:00:00.000Z"
};

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

test("POST /api/messages rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(messagePayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages ignores client-controlled id and sentAt", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_sender", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(messagePayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, messagePayload.id);
    assert.notEqual(payload.data.sentAt, messagePayload.sentAt);
    assert.equal(payload.data.senderId, messagePayload.senderId);
    assert.equal(payload.data.receiverId, messagePayload.receiverId);
    assert.equal(payload.data.content, messagePayload.content);
  });
});
