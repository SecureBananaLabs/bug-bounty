import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/notifications rejects invalid payloads", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "", body: "" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid notification payload"
    });
  });
});

test("POST /api/notifications accepts valid payloads", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "usr_123",
        title: "Ticket updated",
        body: "A support ticket changed status."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.title, "Ticket updated");
    assert.equal(payload.data.body, "A support ticket changed status.");
    assert.equal(payload.data.read, false);
  });
});
