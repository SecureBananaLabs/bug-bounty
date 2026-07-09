import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Notification Security & Validation", async (t) => {
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

  await t.test("POST /api/notifications blocks unauthenticated requests", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr_recipient_1", type: "info", message: "hello" })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/notifications permits authenticated request with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ userId: "usr_recipient_1", type: "info", message: "hello" })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.message, "hello");
  });

  await t.test("POST /api/notifications rejects invalid payloads", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ userId: "", type: "info" })
    });
    assert.equal(response.status, 500);
  });

  await t.test("POST /api/notifications ignores client-controlled id and read status", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "ntf_override_123",
        userId: "usr_recipient_1",
        type: "info",
        message: "hello",
        read: true
      })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.notEqual(data.data.id, "ntf_override_123");
    assert.equal(data.data.read, false);
  });
});
