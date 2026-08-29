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

function buildFormData(bytes, filename, mimeType) {
  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: mimeType }), filename);
  return formData;
}

test("POST /api/uploads accepts allowed file types under 10MB", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildFormData(Uint8Array.from([1, 2, 3]), "avatar.png", "image/png")
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "avatar.png");
  });
});

test("POST /api/uploads rejects unsupported MIME types", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildFormData(Uint8Array.from([1, 2, 3]), "script.exe", "application/x-msdownload")
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported upload file type"
    });
  });
});

test("POST /api/uploads rejects files larger than 10MB", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildFormData(new Uint8Array(10 * 1024 * 1024 + 1), "large.pdf", "application/pdf")
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Uploaded file must be 10MB or smaller"
    });
  });
});
