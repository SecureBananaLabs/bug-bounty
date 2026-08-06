import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications ignores caller-supplied id and read state", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "attacker-controlled-id",
        read: true,
        title: "Build failed",
        message: "CI needs attention"
      })
    });
    const payload = await response.json();
    const notification = payload.data;

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(notification.title, "Build failed");
    assert.equal(notification.message, "CI needs attention");
    assert.notEqual(notification.id, "attacker-controlled-id");
    assert.match(notification.id, /^ntf_/);
    assert.equal(notification.read, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
