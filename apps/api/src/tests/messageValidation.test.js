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

async function postMessage(baseUrl, body) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/messages rejects empty content", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      content: "",
      recipientId: "usr_recipient"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid message payload"
    });
  });
});

test("POST /api/messages rejects missing recipient", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      content: "hello",
      recipientId: ""
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/messages rejects content over 5000 chars", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      content: "x".repeat(5001),
      recipientId: "usr_recipient"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/messages accepts valid messages", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      content: "hello",
      recipientId: "usr_recipient"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.content, "hello");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.match(payload.data.id, /^msg_/);
  });
});
