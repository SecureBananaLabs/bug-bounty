import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { maxUploadBytes } from "../middleware/uploadValidation.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

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

function formWithFile({ content, filename, type }) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), filename);
  return form;
}

test("POST /api/uploads accepts supported file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile({
        content: "hello",
        filename: "note.txt",
        type: "text/plain"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "note.txt",
      contentType: "text/plain",
      size: 5,
      status: "uploaded"
    });
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile({
        content: "<script>alert(1)</script>",
        filename: "payload.html",
        type: "text/html"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported upload file type"
    });
  });
});

test("POST /api/uploads rejects oversized files", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile({
        content: "a".repeat(maxUploadBytes + 1),
        filename: "large.txt",
        type: "text/plain"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Upload file is too large"
    });
  });
});

test("POST /api/uploads rejects missing files", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: new FormData()
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Upload file is required"
    });
  });
});
