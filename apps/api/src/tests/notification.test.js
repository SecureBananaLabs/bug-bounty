import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications rejects caller-supplied id and read", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "hacked_id",
      read: true,
      title: "Test notification"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 201);
  // Caller-supplied id must NOT be used
  assert.notEqual(payload.id, "hacked_id");
  assert.ok(payload.id.startsWith("ntf_"));
  // Caller-supplied read must be overridden to false
  assert.equal(payload.read, false);
  // Original payload fields preserved
  assert.equal(payload.title, "Test notification");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
