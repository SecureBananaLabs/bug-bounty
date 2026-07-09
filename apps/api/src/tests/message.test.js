import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Message Security & Validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_sender_1", role: "client" });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/messages blocks unauthenticated requests", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: "usr_sender_1", receiverId: "usr_receiver_1", content: "hello" })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/messages permits authenticated request with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ senderId: "usr_sender_1", receiverId: "usr_receiver_1", content: "hello" })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.content, "hello");
  });

  await t.test("POST /api/messages rejects invalid payloads", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ senderId: "", receiverId: "usr_receiver_1" })
    });
    assert.equal(response.status, 500);
  });

  await t.test("POST /api/messages ignores client-controlled id", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "msg_override_123",
        senderId: "usr_sender_1",
        receiverId: "usr_receiver_1",
        content: "hello",
        sentAt: "2026-01-01T00:00:00.000Z"
      })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.notEqual(data.data.id, "msg_override_123");
    assert.notEqual(data.data.sentAt, "2026-01-01T00:00:00.000Z");
  });
});
