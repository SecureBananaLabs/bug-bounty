import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

function createValidNotification(overrides = {}) {
  return {
    userId: "user_1",
    title: "Proposal update",
    body: "You have a new proposal.",
    ...overrides
  };
}

test("POST /api/notifications rejects missing body", async () => {
  await withServer(async (baseUrl) => {
    const notification = createValidNotification();
    delete notification.body;

    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(notification)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "body is required"
    });
  });
});

test("POST /api/notifications rejects blank body", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidNotification({ body: "   " }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "body is required"
    });
  });
});

test("POST /api/notifications keeps valid body values working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidNotification({ body: "A freelancer sent a new message." }))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "user_1");
    assert.equal(payload.data.title, "Proposal update");
    assert.equal(payload.data.body, "A freelancer sent a new message.");
    assert.match(payload.data.id, /^ntf_/);
  });
});
