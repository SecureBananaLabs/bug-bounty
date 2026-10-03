import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function fetchOnce(port, path, opts = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, opts);
  const body = await res.json();
  return { status: res.status, body };
}

test("GET /api/search rejects empty query", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const { status, body } = await fetchOnce(port, "/api/search?q=");
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("2 characters"));
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search rejects single-character query", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const { status, body } = await fetchOnce(port, "/api/search?q=a");
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("2 characters"));
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search accepts query with 2+ characters", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const { status, body } = await fetchOnce(port, "/api/search?q=ab");
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.data, { query: "ab", users: [], jobs: [], freelancers: [] });
  await new Promise((resolve) => server.close(resolve));
});
