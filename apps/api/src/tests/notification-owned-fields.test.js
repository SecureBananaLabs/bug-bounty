import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const payload = {
  id: "ntf_client_controlled",
  read: true,
  userId: "usr_123",
  type: "proposal",
  message: "A freelancer sent a new proposal."
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/notifications keeps id and read server-owned", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.equal(result.success, true);
    assert.notEqual(result.data.id, payload.id);
    assert.equal(result.data.read, false);
    assert.equal(result.data.userId, payload.userId);
    assert.equal(result.data.type, payload.type);
    assert.equal(result.data.message, payload.message);
  });
});
