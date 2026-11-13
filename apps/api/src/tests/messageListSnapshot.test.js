import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/messages keeps every stored message after a caller mutates the list", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const headers = { "Content-Type": "application/json" };

  const first = await fetch(`http://127.0.0.1:${port}/api/messages`, { headers });
  const firstPayload = await first.json();
  const before = firstPayload.data.length;

  const sent = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ from: "usr_1", to: "usr_2", body: "hello" })
  });
  const sentPayload = await sent.json();

  assert.equal(sent.status, 201);

  // The previous listing must not be the live store: shrinking it here has to
  // be harmless for the next caller.
  firstPayload.data.pop();

  const second = await fetch(`http://127.0.0.1:${port}/api/messages`, { headers });
  const secondPayload = await second.json();

  assert.equal(secondPayload.data.length, before + 1);
  assert.equal(secondPayload.data.at(-1).id, sentPayload.data.id);

  await close(server);
});
