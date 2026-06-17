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

async function postMessage(baseUrl, body) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/messages rejects missing recipientId", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, { body: "Hello" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.errors[0].path[0], "recipientId");
  });
});

test("POST /api/messages rejects empty body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      recipientId: "user_2",
      body: ""
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.errors[0].path[0], "body");
  });
});

test("POST /api/messages creates message for valid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      recipientId: "user_2",
      body: "Hello"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.recipientId, "user_2");
    assert.equal(payload.data.body, "Hello");
    assert.match(payload.data.id, /^msg_/);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
