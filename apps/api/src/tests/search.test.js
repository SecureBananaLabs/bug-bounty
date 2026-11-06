import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search with valid query returns results", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=test`);
  assert.equal(response.status, 200);
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search with empty query returns results", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=`);
  assert.equal(response.status, 200);
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search without query parameter returns results", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search`);
  assert.equal(response.status, 200);
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/search truncates long query to 200 characters", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const longQuery = "a".repeat(300);
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);
  assert.equal(response.status, 200);
  await new Promise((resolve) => server.close(resolve));
});

