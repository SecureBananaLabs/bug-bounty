import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/messages rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        senderId: "usr_sender",
        receiverId: "usr_receiver",
        content: "hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/messages ignores client-controlled id and keeps service-owned fields", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const token = signAccessToken({ sub: "usr_sender", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "attacker-controlled-id",
        senderId: "usr_sender",
        receiverId: "usr_receiver",
        content: "hello",
        sentAt: "1999-01-01T00:00:00.000Z"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.match(payload.data.id, /^msg_/);
    assert.notEqual(payload.data.id, "attacker-controlled-id");
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.receiverId, "usr_receiver");
    assert.equal(payload.data.content, "hello");
    assert.notEqual(payload.data.sentAt, "1999-01-01T00:00:00.000Z");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
