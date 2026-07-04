import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("notification payload validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /api/notifications with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        title: "New Job Match",
        message: "You have a new matching job proposal!"
      })
    });
    assert.equal(response.status, 201);
  });

  await t.test("POST /api/notifications with missing title", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        message: "Omitted title field"
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("POST /api/notifications with empty message", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        title: "Hello",
        message: "   "
      })
    });
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
