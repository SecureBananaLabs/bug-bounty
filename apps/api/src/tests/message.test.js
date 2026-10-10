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

test("POST /api/messages ignores caller supplied id", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "msg_attacker",
        fromUserId: "usr_1",
        toUserId: "usr_2",
        body: "Hello",
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.notEqual(payload.data.id, "msg_attacker");
    assert.equal(payload.data.fromUserId, "usr_1");
    assert.equal(payload.data.toUserId, "usr_2");
    assert.equal(payload.data.body, "Hello");
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
