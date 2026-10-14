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

  const { port } = server.address();

  try {
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

  return { response, payload: await response.json() };
}

test("POST /api/notifications rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/notifications accepts valid notifications", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postNotification(baseUrl, {
      userId: "usr_1",
      type: "message",
      message: "New message received"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "usr_1");
    assert.equal(payload.data.type, "message");
    assert.equal(payload.data.message, "New message received");
  });
});
