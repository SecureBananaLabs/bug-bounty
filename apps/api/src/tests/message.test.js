import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/messages preserves server-owned id and sentAt", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "client_supplied_id",
        sentAt: "2000-01-01T00:00:00.000Z",
        threadId: "thread_123",
        recipientId: "usr_recipient",
        body: "Hello from the regression test"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.notEqual(payload.data.id, "client_supplied_id");
    assert.notEqual(payload.data.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal(payload.data.threadId, "thread_123");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.body, "Hello from the regression test");
  });
});
