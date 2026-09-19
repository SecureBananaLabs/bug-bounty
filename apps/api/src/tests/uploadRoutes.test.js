import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../app.js";
import { UPLOAD_MAX_BYTES } from "../routes/uploadRoutes.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function uploadFile(port, { filename, content, type }) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), filename);

  return fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
}

test("POST /api/uploads accepts safe attachment types", async () => {
  await withServer(async (port) => {
    const response = await uploadFile(port, {
      filename: "avatar.png",
      content: "png-bytes",
      type: "image/png"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "avatar.png",
        status: "uploaded"
      }
    });
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (port) => {
    const response = await uploadFile(port, {
      filename: "note.txt",
      content: "not an allowed attachment",
      type: "text/plain"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});

test("POST /api/uploads rejects oversized memory uploads", async () => {
  await withServer(async (port) => {
    const response = await uploadFile(port, {
      filename: "large.pdf",
      content: new Uint8Array(UPLOAD_MAX_BYTES + 1),
      type: "application/pdf"
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: `File too large. Maximum upload size is ${UPLOAD_MAX_BYTES} bytes.`
    });
  });
});
