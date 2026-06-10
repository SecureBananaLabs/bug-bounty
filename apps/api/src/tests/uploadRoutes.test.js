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

function buildUploadForm(name, type, content) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), name);
  return form;
}

test("POST /api/uploads accepts a supported file type", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildUploadForm("hello.txt", "text/plain", "hello upload")
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

test("POST /api/uploads rejects unsupported MIME types", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildUploadForm("payload.exe", "application/x-msdownload", "MZ")
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported upload payload"
    });
  });
});

test("POST /api/uploads rejects files larger than 10MB", async () => {
  await withServer(async (port) => {
    const oversizedContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: buildUploadForm("too-large.txt", "text/plain", oversizedContent)
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported upload payload"
    });
  });
});
