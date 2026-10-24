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

test("POST /api/notifications rejects missing title", async () => {
  await withServer(async (baseUrl) => {
    const notification = createValidNotification();
    delete notification.title;

    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(notification)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "title is required"
    });
  });
});

test("POST /api/notifications rejects blank title", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidNotification({ title: "   " }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "title is required"
    });
  });
});

test("POST /api/notifications keeps valid titles working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidNotification({ title: "Billing reminder" }))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "user_1");
    assert.equal(payload.data.title, "Billing reminder");
    assert.equal(payload.data.body, "You have a new proposal.");
    assert.match(payload.data.id, /^ntf_/);
  });
});
