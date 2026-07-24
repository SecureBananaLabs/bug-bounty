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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: "usr_sender", recipientId: "usr_recipient", body: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authenticated message requests keep existing behavior", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_sender" });
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const messageBody = `authenticated hello ${Date.now()}`;

    const createResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ senderId: "usr_sender", recipientId: "usr_recipient", body: messageBody })
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.success, true);
    assert.match(created.data.id, /^msg_/);
    assert.equal(created.data.senderId, "usr_sender");
    assert.equal(created.data.recipientId, "usr_recipient");
    assert.equal(created.data.body, messageBody);
    assert.equal(typeof created.data.sentAt, "string");

    const listResponse = await fetch(`${baseUrl}/api/messages`, { headers });
    const listed = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listed.success, true);
    assert.equal(Array.isArray(listed.data), true);
    assert.ok(listed.data.some((message) => message.id === created.data.id));
  });
});
