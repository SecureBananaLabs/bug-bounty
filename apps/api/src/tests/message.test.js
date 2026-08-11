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

function bearerToken() {
  return signAccessToken({ sub: "usr_sender", role: "client" });
}

async function postJson(url, body, token) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

test("GET /api/messages requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/messages requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/messages`, {
      senderId: "usr_sender",
      receiverId: "usr_receiver",
      body: "Please review the milestone."
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/messages accepts valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(
      `${baseUrl}/api/messages`,
      {
        senderId: "usr_sender",
        receiverId: "usr_receiver",
        body: "Please review the milestone."
      },
      bearerToken()
    );
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_\d+$/);
  });
});
