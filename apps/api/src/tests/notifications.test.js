import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createNotification } from "../services/notificationService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createNotification always creates unread notifications", async () => {
  const notification = await createNotification({
    userId: "usr_123",
    type: "message",
    message: "New message received",
    read: true
  });

  assert.equal(notification.read, false);
});

test("POST /api/notifications rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "userId is required"
    });
  });
});

test("POST /api/notifications creates unread notifications", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        type: "billing",
        message: "Invoice paid",
        read: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.type, "billing");
    assert.equal(payload.data.message, "Invoice paid");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});
