import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
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

function makeFormData(sizeInBytes) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([Buffer.alloc(sizeInBytes, "a")]),
    "upload.bin"
  );
  return form;
}

test("POST /api/uploads accepts small files", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: makeFormData(1024)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "upload.bin");
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects files larger than the configured limit", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: makeFormData(5 * 1024 * 1024 + 1)
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, { success: false, message: "File too large" });
  });
});
