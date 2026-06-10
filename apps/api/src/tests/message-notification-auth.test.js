import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/notifications requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authenticated listings still succeed", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user_123", email: "agent@example.com" });
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const messageCreateResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: "hello world" })
    });
    assert.equal(messageCreateResponse.status, 201);

    const notificationCreateResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "Heads up" })
    });
    assert.equal(notificationCreateResponse.status, 201);

    const messageListResponse = await fetch(`${baseUrl}/api/messages`, { headers });
    const messageListPayload = await messageListResponse.json();
    assert.equal(messageListResponse.status, 200);
    assert.equal(messageListPayload.success, true);
    assert.equal(messageListPayload.data.length, 1);

    const notificationListResponse = await fetch(`${baseUrl}/api/notifications`, { headers });
    const notificationListPayload = await notificationListResponse.json();
    assert.equal(notificationListResponse.status, 200);
    assert.equal(notificationListPayload.success, true);
    assert.equal(notificationListPayload.data.length, 1);
  });
});
