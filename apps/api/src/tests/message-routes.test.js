import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken() {
  return signAccessToken({ sub: "usr_messages", role: "client" });
}

test("POST /api/messages requires authentication", async () => {
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_1",
        receiverId: "usr_2",
        content: "Hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/messages preserves server-owned id and sentAt", async () => {
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
        "content-type": "application/json",
        Authorization: `Bearer ${createAuthToken()}`
      },
      body: JSON.stringify({
        senderId: "usr_3",
        receiverId: "usr_4",
        content: "Scoped fix ready.",
        id: "msg_attacker_supplied",
        sentAt: "2000-01-01T00:00:00.000Z",
        ignored: "drop-me"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.senderId, "usr_3");
    assert.equal(payload.data.receiverId, "usr_4");
    assert.equal(payload.data.content, "Scoped fix ready.");
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.notEqual(payload.data.id, "msg_attacker_supplied");
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.notEqual(payload.data.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal("ignored" in payload.data, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
