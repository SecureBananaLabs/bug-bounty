import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/messages creates message with server-owned ID and sentAt", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Hello", senderId: "usr_1", receiverId: "usr_2" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.ok(payload.success);
    assert.ok(payload.data.id.startsWith("msg_"));
    assert.ok(payload.data.sentAt);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/messages ignores client-supplied ID and sentAt", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "msg_client_hijack",
        sentAt: "2020-01-01T00:00:00.000Z",
        content: "Hello",
        senderId: "usr_1",
        receiverId: "usr_2",
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.ok(payload.success);
    assert.notEqual(payload.data.id, "msg_client_hijack");
    assert.ok(payload.data.id.startsWith("msg_"));
    assert.notEqual(payload.data.sentAt, "2020-01-01T00:00:00.000Z");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
