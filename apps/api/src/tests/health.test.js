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

test("malformed JSON requests consume global rate limit quota", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    let rateLimitedResponse;
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      for (let attempt = 0; attempt < 205; attempt += 1) {
        const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{"
        });

        if (response.status === 429) {
          rateLimitedResponse = response;
          break;
        }
      }
    } finally {
      console.error = originalConsoleError;
    }

    assert.ok(rateLimitedResponse, "expected malformed JSON requests to eventually hit the rate limiter");
    assert.equal(rateLimitedResponse.status, 429);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
