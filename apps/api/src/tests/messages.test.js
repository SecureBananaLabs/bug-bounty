import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(testFn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await testFn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, payload) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/messages rejects missing message body", async () => {
  await withServer(async (baseUrl) => {
    const before = await (await fetch(`${baseUrl}/api/messages`)).json();
    const response = await postJson(baseUrl, "/api/messages", {});
    const payload = await response.json();
    const after = await (await fetch(`${baseUrl}/api/messages`)).json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Message body is required" });
    assert.deepEqual(after.data, before.data);
  });
});

test("POST /api/messages rejects blank message body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/messages", {
      threadId: "thread_blank",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Message body is required" });
  });
});

test("POST /api/messages stores valid message bodies", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/messages", {
      threadId: "thread_valid",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you send the milestone update?"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.body, "Can you send the milestone update?");
    assert.match(payload.data.id, /^msg_/);
    assert.ok(payload.data.sentAt);
  });
});
