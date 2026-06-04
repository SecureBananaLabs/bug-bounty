import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

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

test("Message Routes Input Validation", async (t) => {
  await t.test("POST /api/messages rejects empty payload", async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Invalid message payload");
    });
  });

  await t.test("POST /api/messages rejects missing recipientId", async () => {
    await withServer(async (baseUrl) => {
      const payload = {
        senderId: "usr_sender123",
        content: "Hello world"
      };

      const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Invalid message payload");
    });
  });

  await t.test("POST /api/messages accepts valid payload and stores it", async () => {
    await withServer(async (baseUrl) => {
      const payload = {
        senderId: "usr_sender123",
        recipientId: "usr_recipient456",
        content: "Hello world!"
      };

      const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      assert.equal(response.status, 201);
      assert.equal(body.success, true);
      assert.equal(body.data.senderId, payload.senderId);
      assert.equal(body.data.recipientId, payload.recipientId);
      assert.equal(body.data.content, payload.content);
      assert.ok(body.data.id);
      assert.ok(body.data.sentAt);
    });
  });
});
