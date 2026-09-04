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
    return await run(`http://127.0.0.1:${port}`);
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

test("POST /api/notifications rejects empty payload", async () => {
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

test("POST /api/notifications rejects blank required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      type: "",
      message: " ",
      recipientId: ""
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/notifications accepts valid notifications", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      type: "message",
      message: "You have a new message",
      recipientId: "usr_recipient"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.read, false);
    assert.equal(payload.data.type, "message");
    assert.equal(payload.data.message, "You have a new message");
    assert.equal(payload.data.recipientId, "usr_recipient");
  });
});
