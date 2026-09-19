import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

const validNotification = {
  type: "message",
  message: "You have a new message.",
  recipientId: "usr_receiver"
};

test("POST /api/notifications rejects empty and blank required fields", async () => {
  await withServer(async (port) => {
    const invalidPayloads = [
      {},
      { ...validNotification, type: "" },
      { ...validNotification, message: "" },
      { ...validNotification, recipientId: "" }
    ];

    for (const payload of invalidPayloads) {
      const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
    }
  });
});

test("POST /api/notifications accepts valid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validNotification)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.type, validNotification.type);
    assert.equal(payload.data.message, validNotification.message);
    assert.equal(payload.data.recipientId, validNotification.recipientId);
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});
