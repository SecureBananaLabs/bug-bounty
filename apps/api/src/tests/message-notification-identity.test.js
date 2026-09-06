import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages requires auth and binds senderId", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_admin",
        recipientId: "usr_victim",
        body: "spoofed"
      })
    });
    const anonymousPayload = await anonymous.json();

    assert.equal(anonymous.status, 401);
    assert.deepEqual(anonymousPayload, {
      success: false,
      message: "Unauthorized"
    });

    const token = signAccessToken({ sub: "usr_auth", role: "client" });
    const authenticated = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        senderId: "usr_admin",
        recipientId: "usr_victim",
        body: "spoofed"
      })
    });
    const authenticatedPayload = await authenticated.json();

    assert.equal(authenticated.status, 201);
    assert.equal(authenticatedPayload.success, true);
    assert.equal(authenticatedPayload.data.senderId, "usr_auth");
    assert.equal(authenticatedPayload.data.recipientId, "usr_victim");
    assert.equal(authenticatedPayload.data.body, "spoofed");
    assert.match(authenticatedPayload.data.id, /^msg_/);
  });
});

test("POST /api/notifications requires auth and binds userId", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "usr_victim",
        type: "message",
        text: "spoofed"
      })
    });
    const anonymousPayload = await anonymous.json();

    assert.equal(anonymous.status, 401);
    assert.deepEqual(anonymousPayload, {
      success: false,
      message: "Unauthorized"
    });

    const token = signAccessToken({ sub: "usr_auth", role: "client" });
    const authenticated = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: "usr_victim",
        type: "message",
        text: "spoofed"
      })
    });
    const authenticatedPayload = await authenticated.json();

    assert.equal(authenticated.status, 201);
    assert.equal(authenticatedPayload.success, true);
    assert.equal(authenticatedPayload.data.userId, "usr_auth");
    assert.equal(authenticatedPayload.data.type, "message");
    assert.equal(authenticatedPayload.data.text, "spoofed");
    assert.equal(authenticatedPayload.data.read, false);
    assert.match(authenticatedPayload.data.id, /^ntf_/);
  });
});
