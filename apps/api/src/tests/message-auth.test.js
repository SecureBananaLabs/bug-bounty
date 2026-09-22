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

  const { port } = server.address();

  try {
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages rejects unauthenticated message creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "hello", receiverId: "usr_receiver" })
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages uses authenticated user as sender", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_authenticated", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "msg_client_supplied",
        body: "hello",
        senderId: "usr_spoofed",
        receiverId: "usr_receiver"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.body, "hello");
    assert.equal(payload.data.receiverId, "usr_receiver");
    assert.equal(payload.data.senderId, "usr_authenticated");
    assert.notEqual(payload.data.id, "msg_client_supplied");
    assert.match(payload.data.id, /^msg_/);
    assert.equal(typeof payload.data.sentAt, "string");
  });
});
