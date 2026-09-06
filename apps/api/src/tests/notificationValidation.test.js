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
    body: JSON.stringify(body)
  });
}

test("POST /api/notifications rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "user_1",
      title: "Welcome"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.errors[0].path[0], "message");
  });
});

test("POST /api/notifications rejects malformed userId", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: 123,
      title: "Welcome",
      message: "Your account is ready"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.errors[0].path[0], "userId");
  });
});

test("POST /api/notifications creates notification for valid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      userId: "user_1",
      title: "Welcome",
      message: "Your account is ready"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "user_1");
    assert.equal(payload.data.title, "Welcome");
    assert.equal(payload.data.message, "Your account is ready");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});
