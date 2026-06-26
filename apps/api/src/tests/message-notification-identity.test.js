import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body, token) {
  const headers = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("message and notification creation bind identity to the authenticated user", async () => {
  await withServer(async (baseUrl) => {
    const anonymousMessage = await postJson(baseUrl, "/api/messages", {
      senderId: "usr_attacker",
      recipientId: "usr_target",
      body: "spoofed"
    });
    const anonymousNotification = await postJson(baseUrl, "/api/notifications", {
      userId: "usr_target",
      type: "message",
      text: "spoofed"
    });
    const token = signAccessToken({ sub: "usr_actor", role: "client" });
    const message = await postJson(baseUrl, "/api/messages", {
      senderId: "usr_attacker",
      recipientId: "usr_target",
      body: "hello"
    }, token);
    const notification = await postJson(baseUrl, "/api/notifications", {
      userId: "usr_target",
      type: "message",
      text: "hello"
    }, token);

    assert.equal(anonymousMessage.response.status, 401);
    assert.equal(anonymousNotification.response.status, 401);
    assert.equal(message.response.status, 201);
    assert.equal(message.payload.data.senderId, "usr_actor");
    assert.equal(notification.response.status, 201);
    assert.equal(notification.payload.data.userId, "usr_actor");
  });
});
