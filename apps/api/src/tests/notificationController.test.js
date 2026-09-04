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

  const { port } = server.address();

  try {
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST /api/notifications rejects missing message", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Notification message is required" });
  });
});

test("POST /api/notifications rejects non-string message", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, { message: 42 });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Notification message is required" });
  });
});

test("POST /api/notifications rejects blank message", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, { message: "   " });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Notification message is required" });
  });
});

test("POST /api/notifications creates notification for valid message", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, { message: "Proposal accepted" });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.message, "Proposal accepted");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_\d+$/);
  });
});
