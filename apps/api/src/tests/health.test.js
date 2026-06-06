import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("shared API rate limiter returns JSON error payloads", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    let response;

    for (let i = 0; i < 201; i += 1) {
      response = await fetch(`http://127.0.0.1:${port}/api/search`);
    }

    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("content-type").includes("application/json"), true);
    assert.deepEqual(payload, { success: false, message: "Too many requests" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
