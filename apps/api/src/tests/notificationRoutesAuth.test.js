import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withTestServer(run) {
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

function authHeaders() {
  const token = signAccessToken({ sub: "usr_test_notification_auth", role: "client" });
  return { Authorization: `Bearer ${token}` };
}

test("GET /api/notifications requires authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/notifications requires authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "blocked" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authenticated notification routes reach existing controllers", async () => {
  await withTestServer(async (baseUrl) => {
    const created = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ message: "hello" })
    });
    const createdPayload = await created.json();

    assert.equal(created.status, 201);
    assert.equal(createdPayload.success, true);
    assert.equal(createdPayload.data.message, "hello");

    const listed = await fetch(`${baseUrl}/api/notifications`, {
      headers: authHeaders()
    });
    const listedPayload = await listed.json();

    assert.equal(listed.status, 200);
    assert.equal(listedPayload.success, true);
    assert.ok(listedPayload.data.some((notification) => notification.message === "hello"));
  });
});
