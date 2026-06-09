import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts a small file", async () => {
  await withServer(async (port) => {
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(1024)], { type: "text/plain" }), "small.txt");
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects an oversize file with 413", async () => {
  await withServer(async (port) => {
    // 6 MiB exceeds the 5 MiB cap configured on the multer middleware.
    const big = new Uint8Array(6 * 1024 * 1024);
    const form = new FormData();
    form.set("file", new Blob([big], { type: "application/octet-stream" }), "big.bin");
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();
    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File too large");
  });
});
