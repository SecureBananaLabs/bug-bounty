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
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  assert.equal(response.status, 201);
  return response.json();
}

async function getJson(baseUrl, path, userId) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      authorization: `Bearer ${signAccessToken({ sub: userId, role: "client" })}`
    }
  });

  assert.equal(response.status, 200);
  return response.json();
}

test("message and notification list endpoints require authentication", async () => {
  await withServer(async (baseUrl) => {
    for (const path of ["/api/messages", "/api/notifications"]) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, { success: false, message: "Unauthorized" });
    }
  });
});

test("message lists are scoped to the authenticated sender or recipient", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/messages", {
      senderId: "usr_alice",
      recipientId: "usr_bob",
      body: "visible to alice and bob"
    });
    await postJson(baseUrl, "/api/messages", {
      senderId: "usr_carol",
      recipientId: "usr_dan",
      body: "not visible to alice"
    });

    const payload = await getJson(baseUrl, "/api/messages", "usr_alice");

    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].body, "visible to alice and bob");
  });
});

test("notification lists are scoped to the authenticated user", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/notifications", {
      userId: "usr_alice",
      message: "visible to alice"
    });
    await postJson(baseUrl, "/api/notifications", {
      userId: "usr_bob",
      message: "not visible to alice"
    });

    const payload = await getJson(baseUrl, "/api/notifications", "usr_alice");

    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].message, "visible to alice");
  });
});
