import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { UPLOAD_FILE_SIZE_LIMIT_BYTES } from "../routes/uploadRoutes.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

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

test("POST /api/uploads rejects files larger than the memory upload limit", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const oversized = new Blob([new Uint8Array(UPLOAD_FILE_SIZE_LIMIT_BYTES + 1)]);
    form.append("file", oversized, "oversized.bin");

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

test("POST /api/uploads still accepts files within the memory upload limit", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const allowed = new Blob([new Uint8Array(16)]);
    form.append("file", allowed, "small.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "small.bin",
      status: "uploaded"
    });
  });
});
