import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUpload(baseUrl, file) {
  const form = new FormData();
  form.append("file", file.blob, file.name);

  return fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: form
  });
}

test("POST /api/uploads accepts allowed file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl, {
      name: "profile.png",
      blob: new Blob(["png data"], { type: "image/png" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "profile.png",
        status: "uploaded"
      }
    });
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl, {
      name: "script.js",
      blob: new Blob(["alert(1)"], { type: "application/javascript" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});

test("POST /api/uploads rejects files larger than 10MB", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl, {
      name: "large.pdf",
      blob: new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 1)], {
        type: "application/pdf"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Uploaded file is too large"
    });
  });
});
