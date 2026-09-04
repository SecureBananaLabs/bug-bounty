import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/search without q returns 400", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /Missing required query parameter/);
  await close(server);
});

test("GET /api/search with empty q returns 400", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  await close(server);
});

test("GET /api/search with whitespace-only q returns 400", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20%20`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  await close(server);
});

test("GET /api/search with q longer than 200 chars returns 400", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();
  const longQ = "a".repeat(201);
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQ}`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /200 characters/);
  await close(server);
});

test("GET /api/search with valid q returns 200", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=hello`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data);
  await close(server);
});
