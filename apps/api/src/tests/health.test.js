import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(testFn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await testFn(`http://127.0.0.1:${port}`);
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

test("unknown routes return JSON not found responses", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, { success: false, message: "Not found" });
  });
});
