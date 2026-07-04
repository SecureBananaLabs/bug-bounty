import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("message payload validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /api/messages with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: "usr_2",
        content: "Hello, world!"
      })
    });
    assert.equal(response.status, 201);
  });

  await t.test("POST /api/messages with missing recipientId", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Hello"
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("POST /api/messages with empty content", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: "usr_2",
        content: "   "
      })
    });
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
