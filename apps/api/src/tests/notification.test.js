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

async function postNotification(baseUrl, body) {
  return fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/notifications rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid notification payload"
    });
  });
});

test("POST /api/notifications keeps read server-controlled", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "usr_123",
      type: "ticket.created",
      message: "A ticket was created.",
      read: true
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.type, "ticket.created");
    assert.equal(payload.data.message, "A ticket was created.");
    assert.equal(payload.data.read, false);
  });
});

test("POST /api/notifications accepts a valid notification", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "usr_456",
      type: "ticket.updated",
      message: "A ticket was updated."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.userId, "usr_456");
    assert.equal(payload.data.type, "ticket.updated");
    assert.equal(payload.data.message, "A ticket was updated.");
    assert.equal(payload.data.read, false);
  });
});
