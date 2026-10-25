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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts a file under the size limit", async () => {
  await withServer(async (port) => {
    const form = new FormData();
    form.append("file", new Blob(["hello world"], { type: "text/plain" }), "hello.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "hello.txt",
        status: "uploaded"
      }
    });
  });
});

test("POST /api/uploads rejects oversized files with 413", async () => {
  await withServer(async (port) => {
    const form = new FormData();
    const oversized = new Uint8Array(1024 * 1024 + 1);
    form.append("file", new Blob([oversized], { type: "application/octet-stream" }), "too-large.bin");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Uploaded file too large"
    });
  });
});
