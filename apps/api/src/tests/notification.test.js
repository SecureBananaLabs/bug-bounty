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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postNotification(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();

  return { response, payload };
}

test("POST /api/notifications rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid notification payload" });
  });
});

test("POST /api/notifications rejects blank notification fields", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: " ",
      type: "billing",
      message: ""
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid notification payload" });
  });
});

test("POST /api/notifications creates valid unread notifications", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: "usr_123",
      type: "billing",
      message: "Invoice payment received"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.read, false);
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.type, "billing");
    assert.equal(payload.data.message, "Invoice payment received");
  });
});
