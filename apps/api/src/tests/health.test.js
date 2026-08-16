import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
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

test("GET /health bypasses the global API rate limit", async () => {
  await withServer(async (baseUrl) => {
    for (let requestNumber = 1; requestNumber <= 201; requestNumber += 1) {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200, `request ${requestNumber} should remain healthy`);
    }
  });
});

test("API routes still use the global API rate limit", async () => {
  await withServer(async (baseUrl) => {
    let response;

    for (let requestNumber = 1; requestNumber <= 201; requestNumber += 1) {
      response = await fetch(`${baseUrl}/api/jobs`);
    }

    assert.equal(response.status, 429);
  });
});
