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

test("POST /api/messages returns 400 for invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: "   ",
        senderId: "",
        receiverId: "   "
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.deepEqual(
      payload.errors.map((error) => error.path).sort(),
      ["body", "receiverId", "senderId"]
    );
  });
});

test("POST /api/messages creates a message for valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: "Hello from client",
        senderId: "usr_sender",
        receiverId: "usr_receiver"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.body, "Hello from client");
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.receiverId, "usr_receiver");
    assert.match(payload.data.id, /^msg_/);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
