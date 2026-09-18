import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = await listen(app);

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await close(server);
});

test("GET /health bypasses the shared API rate limiter", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    for (let i = 0; i < 205; i += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(response.status, 200);
    }
  } finally {
    await close(server);
  }
});
