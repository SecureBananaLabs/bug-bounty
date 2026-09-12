import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const RATE_LIMIT = 200;

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("GET /health is not rate-limited by the shared API limiter", async () => {
  await withServer(async (baseUrl) => {
    for (let index = 0; index < RATE_LIMIT + 1; index += 1) {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
    }
  });
});

test("shared API limiter still applies to API routes", async () => {
  await withServer(async (baseUrl) => {
    let response;

    for (let index = 0; index < RATE_LIMIT + 1; index += 1) {
      response = await fetch(`${baseUrl}/api/search`);
    }

    assert.equal(response.status, 429);
  });
});
