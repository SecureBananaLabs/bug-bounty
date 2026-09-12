import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
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

async function postNotification(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/notifications accepts a valid notification payload", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: "user_123",
      title: "Proposal accepted",
      body: "Your proposal was accepted by the client."
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "user_123");
    assert.equal(payload.data.title, "Proposal accepted");
    assert.equal(payload.data.body, "Your proposal was accepted by the client.");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});

test("POST /api/notifications rejects empty titles", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: "user_123",
      title: "",
      body: "Missing title should fail."
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid notification payload" });
  });
});

test("POST /api/notifications rejects client-controlled read state", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: "user_123",
      title: "Forged read state",
      body: "The client should not decide read state on creation.",
      read: true
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid notification payload" });
  });
});
