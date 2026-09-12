import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/notifications keeps id and read state server-owned", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/notifications`, {
      id: "ntf_attacker_controlled",
      userId: "usr_recipient",
      title: "Proposal update",
      body: "A freelancer replied to your job.",
      read: true
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "ntf_attacker_controlled");
    assert.match(payload.data.id, /^ntf_\d+$/);
    assert.equal(payload.data.read, false);
  });
});
