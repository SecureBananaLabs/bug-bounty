import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/notifications rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid notification payload"
    });
  });
});

test("POST /api/notifications stores only validated notification fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "usr-client",
        title: "Proposal update",
        body: "Maya sent a revised project proposal.",
        type: "proposal",
        read: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.read, false);
    assert.equal(payload.data.userId, "usr-client");
  });
});

test("GET /api/notifications includes valid created notifications", async () => {
  await withServer(async (baseUrl) => {
    const notification = {
      userId: "usr-freelancer",
      title: "Unread message",
      body: "A client replied to your latest thread.",
      type: "message"
    };

    const createResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(notification)
    });
    const createPayload = await createResponse.json();
    const listResponse = await fetch(`${baseUrl}/api/notifications`);
    const listPayload = await listResponse.json();

    assert.equal(createResponse.status, 201);
    assert.ok(listPayload.data.some((item) => item.id === createPayload.data.id));
  });
});
