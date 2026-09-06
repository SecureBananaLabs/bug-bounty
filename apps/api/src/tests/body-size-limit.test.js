import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST with body exceeding 1mb limit returns 413", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Build a JSON payload larger than 1mb
  const bigPayload = JSON.stringify({ title: "x".repeat(1024 * 1024 + 100) });

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bigPayload
  });

  assert.ok(
    response.status === 413,
    `Expected 413 but got ${response.status}`
  );

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST with normal-sized body still works", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "hello world" })
  });

  assert.equal(response.status, 201);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
