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

test("POST /api/messages rejects anonymous callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipientId: "usr_2", body: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages accepts authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({
      sub: "user_message_auth",
      role: "client"
    });

    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ recipientId: "usr_2", body: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.recipientId, "usr_2");
    assert.equal(payload.data.body, "hello");
    assert.match(payload.data.id, /^msg_/);
  });
});
