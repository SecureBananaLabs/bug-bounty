import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postNotification(baseUrl, payload) {
  return fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/notifications rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "user_1",
      body: "Missing title"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid notification payload"
    });
  });
});

test("POST /api/notifications rejects blank notification body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "user_1",
      title: "Update",
      body: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/notifications preserves server-owned fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      id: "ntf_caller",
      read: true,
      userId: "user_1",
      title: "Update",
      body: "Your proposal changed"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.notEqual(payload.data.id, "ntf_caller");
    assert.equal(payload.data.read, false);
    assert.equal(payload.data.userId, "user_1");
    assert.equal(payload.data.title, "Update");
    assert.equal(payload.data.body, "Your proposal changed");
  });
});
