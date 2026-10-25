import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    await fn(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("unmatched API route returns 404 JSON envelope", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, { success: false, message: "Not found" });
  });
});

test("unmatched route under a mounted prefix returns 404 JSON envelope", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs/unknown/sub/path`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, { success: false, message: "Not found" });
  });
});

test("defined routes still respond normally", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
