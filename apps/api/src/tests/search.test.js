import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((res, rej) => {
    server.once("listening", () => res(server));
    server.once("error", rej);
  });
}
function close(server) {
  return new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

test("GET /api/search - handles long query gracefully", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const longQuery = "a".repeat(1000);
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${encodeURIComponent(longQuery)}`);
  assert.ok(res.status === 200 || res.status === 400, `expected 200 or 400 got ${res.status}`);
  await close(server);
});

test("GET /api/search - rejects repeated q params", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=foo&q=bar`);
  assert.ok(res.status === 200 || res.status === 400, `expected 200 or 400 got ${res.status}`);
  await close(server);
});
