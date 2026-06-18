import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function messagePayload() {
  return {
    recipientId: "usr_recipient",
    body: "Hello"
  };
}

async function postMessage(baseUrl, options = {}) {
  return fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    body: JSON.stringify(messagePayload())
  });
}

test("POST /api/messages rejects unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/messages keeps existing response for authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await postMessage(baseUrl, {
      headers: {
        Authorization: `Bearer ${signAccessToken({ sub: "usr_sender", role: "client" })}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.body, "Hello");
    assert.match(payload.data.id, /^msg_/);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
