import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "../routes/uploadRoutes.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function uploadBody(size) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(size)]), "upload.bin");
  return form;
}

test("POST /api/uploads accepts files within the size limit", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: uploadBody(128)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "upload.bin",
      status: "uploaded"
    });
  });
});

test("POST /api/uploads returns a controlled error for oversized files", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: uploadBody(MAX_UPLOAD_FILE_SIZE_BYTES + 1)
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, { success: false, message: "File too large" });
  });
});
