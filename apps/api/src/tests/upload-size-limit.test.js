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

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects files over 5 MB with predictable error code", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)]), "too-large.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      code: "LIMIT_FILE_SIZE",
      message: "File size exceeds 5 MB limit"
    });
  });
});

test("POST /api/uploads accepts files at or below 5 MB", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob([Buffer.alloc(1024)]), "small.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "small.txt",
      status: "uploaded"
    });
  });
});
