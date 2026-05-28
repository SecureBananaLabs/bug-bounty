import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_UPLOAD_SIZE_BYTES } from "../routes/uploadRoutes.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts a small file", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
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

test("POST /api/uploads rejects oversized in-memory files", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1)]), "too-large.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Uploaded file exceeds the maximum allowed size"
    });
  });
});
