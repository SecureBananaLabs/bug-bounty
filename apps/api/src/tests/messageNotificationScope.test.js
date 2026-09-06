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
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function getJson(baseUrl, path, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });

  return { response, payload: await response.json() };
}

test("message list rejects anonymous reads and scopes messages to the authenticated user", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/messages", {
      senderId: "usr_scope_a",
      recipientId: "usr_scope_b",
      body: "visible to both users"
    });
    await postJson(baseUrl, "/api/messages", {
      senderId: "usr_scope_c",
      recipientId: "usr_scope_d",
      body: "private to other users"
    });

    const anonymous = await getJson(baseUrl, "/api/messages");
    assert.equal(anonymous.response.status, 401);
    assert.deepEqual(anonymous.payload, { success: false, message: "Unauthorized" });

    const token = signAccessToken({ sub: "usr_scope_a", role: "client" });
    const { response, payload } = await getJson(baseUrl, "/api/messages", token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].body, "visible to both users");
  });
});

test("notification list rejects anonymous reads and scopes notifications to the authenticated user", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/notifications", {
      userId: "usr_notify_a",
      type: "proposal.received",
      message: "You received a proposal"
    });
    await postJson(baseUrl, "/api/notifications", {
      userId: "usr_notify_b",
      type: "billing.alert",
      message: "Another user's notification"
    });

    const anonymous = await getJson(baseUrl, "/api/notifications");
    assert.equal(anonymous.response.status, 401);
    assert.deepEqual(anonymous.payload, { success: false, message: "Unauthorized" });

    const token = signAccessToken({ sub: "usr_notify_a", role: "client" });
    const { response, payload } = await getJson(baseUrl, "/api/notifications", token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].message, "You received a proposal");
  });
});
