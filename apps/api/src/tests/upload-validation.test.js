import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function uploadFile(baseUrl, file) {
  const form = new FormData();
  form.append("file", file.blob, file.name);

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: form
  });

  return {
    status: response.status,
    payload: await response.json()
  };
}

test("upload accepts allowed document MIME types", async () => {
  await withServer(async (baseUrl) => {
    const result = await uploadFile(baseUrl, {
      name: "notes.txt",
      blob: new Blob(["hello"], { type: "text/plain" })
    });

    assert.equal(result.status, 201);
    assert.equal(result.payload.success, true);
    assert.equal(result.payload.data.filename, "notes.txt");
    assert.equal(result.payload.data.status, "uploaded");
  });
});

test("upload rejects unsupported MIME types", async () => {
  await withServer(async (baseUrl) => {
    const result = await uploadFile(baseUrl, {
      name: "payload.exe",
      blob: new Blob(["MZ"], { type: "application/x-msdownload" })
    });

    assert.equal(result.status, 400);
    assert.equal(result.payload.success, false);
    assert.equal(result.payload.message, "Unsupported file type");
  });
});

test("upload rejects files larger than 10MB", async () => {
  await withServer(async (baseUrl) => {
    const result = await uploadFile(baseUrl, {
      name: "oversized.png",
      blob: new Blob([new Uint8Array((10 * 1024 * 1024) + 1)], { type: "image/png" })
    });

    assert.equal(result.status, 400);
    assert.equal(result.payload.success, false);
    assert.equal(result.payload.message, "File too large");
  });
});
