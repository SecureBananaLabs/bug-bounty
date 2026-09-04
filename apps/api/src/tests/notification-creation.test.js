import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/notifications preserves server-owned id and read state", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "client_supplied",
        read: true,
        userId: "usr_123",
        title: "Proposal accepted",
        body: "Your proposal was accepted."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "client_supplied");
    assert.match(payload.data.id, /^ntf_/);
    assert.equal(payload.data.read, false);
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.title, "Proposal accepted");
  } finally {
    await close(server);
  }
});
