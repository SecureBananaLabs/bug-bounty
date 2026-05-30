import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/messages rejects unauthenticated message creation", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipientId: "usr_recipient",
        body: "unauthorized message",
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await close(server);
  }
});

test("POST /api/messages allows authenticated message creation", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const token = signAccessToken({ sub: "usr_sender", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipientId: "usr_recipient",
        body: "authenticated message",
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.body, "authenticated message");
    assert.match(payload.data.id, /^msg_/);
    assert.ok(payload.data.sentAt);
  } finally {
    await close(server);
  }
});
