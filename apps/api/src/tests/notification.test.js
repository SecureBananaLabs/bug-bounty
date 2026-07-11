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

async function postNotification(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { response, body: await response.json() };
}

test("POST /api/notifications keeps id and read state server-owned", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postNotification(baseUrl, {
      id: "ntf_client_supplied",
      read: true,
      message: "New proposal received",
      type: "proposal"
    });

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.id, /^ntf_\d+$/);
    assert.notEqual(body.data.id, "ntf_client_supplied");
    assert.equal(body.data.read, false);
    assert.equal(body.data.message, "New proposal received");
    assert.equal(body.data.type, "proposal");
  });
});

test("GET /api/notifications returns persisted server-owned notification state", async () => {
  await withServer(async (baseUrl) => {
    const marker = `notification-${Date.now()}`;
    const created = await postNotification(baseUrl, {
      id: "ntf_attacker",
      read: true,
      message: marker
    });

    assert.equal(created.response.status, 201);

    const response = await fetch(`${baseUrl}/api/notifications`);
    const body = await response.json();
    const saved = body.data.find((notification) => notification.message === marker);

    assert.equal(response.status, 200);
    assert.ok(saved);
    assert.equal(saved.id, created.body.data.id);
    assert.notEqual(saved.id, "ntf_attacker");
    assert.equal(saved.read, false);
  });
});
