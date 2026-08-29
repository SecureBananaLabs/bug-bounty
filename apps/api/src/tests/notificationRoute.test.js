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
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/notifications creates a notification with a valid message", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello" })
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.message, "hello");
  });
});

test("POST /api/notifications rejects a missing message with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/notifications rejects a whitespace-only message with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " })
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/notifications rejects a non-string message with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: 123 })
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});
