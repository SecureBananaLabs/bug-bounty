import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        senderId: "usr_spoofed",
        recipientId: "usr_bob",
        body: "hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/messages stores the authenticated user as senderId", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        senderId: "usr_spoofed",
        recipientId: "usr_bob",
        body: "hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.senderId, "usr_alice");
    assert.equal(payload.data.recipientId, "usr_bob");
    assert.equal(payload.data.body, "hello");
  });
});

test("POST /api/notifications rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        userId: "usr_spoofed",
        type: "message",
        text: "hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/notifications stores the authenticated user as userId", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        userId: "usr_spoofed",
        type: "message",
        text: "hello"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "usr_alice");
    assert.equal(payload.data.type, "message");
    assert.equal(payload.data.text, "hello");
    assert.equal(payload.data.read, false);
  });
});
