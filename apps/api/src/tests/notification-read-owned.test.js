import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications keeps read/status server-owned", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const createResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user_2499",
        title: "Server owned fields",
        body: "Client should not control read/status",
        read: true,
        status: "READ"
      })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.read, false);
    assert.equal("status" in createPayload.data, false);

    const listResponse = await fetch(`${baseUrl}/api/notifications`);
    const listPayload = await listResponse.json();
    const created = listPayload.data.find((item) => item.id === createPayload.data.id);

    assert.equal(listResponse.status, 200);
    assert.ok(created);
    assert.equal(created.read, false);
    assert.equal("status" in created, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
