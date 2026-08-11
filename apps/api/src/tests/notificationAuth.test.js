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

function notificationPayload() {
  return {
    message: "Proposal accepted",
    type: "proposal"
  };
}

async function postNotification(baseUrl, options = {}) {
  return fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    body: JSON.stringify(notificationPayload())
  });
}

test("POST /api/notifications rejects unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/notifications keeps existing response for authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await postNotification(baseUrl, {
      headers: {
        Authorization: `Bearer ${signAccessToken({ sub: "usr_test", role: "client" })}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.message, "Proposal accepted");
    assert.equal(payload.data.type, "proposal");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});
