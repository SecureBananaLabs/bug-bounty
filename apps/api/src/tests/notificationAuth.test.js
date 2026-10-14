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

test("POST /api/notifications rejects anonymous callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "usr_1", message: "New proposal" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/notifications accepts authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({
      sub: "user_notification_auth",
      role: "client"
    });

    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ userId: "usr_1", message: "New proposal" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.userId, "usr_1");
    assert.equal(payload.data.message, "New proposal");
    assert.equal(payload.data.read, false);
    assert.match(payload.data.id, /^ntf_/);
  });
});
