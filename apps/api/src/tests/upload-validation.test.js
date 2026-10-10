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

  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUpload(baseUrl, body) {
  return fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    ...(body ? { body } : {})
  });
}

test("POST /api/uploads rejects requests without a file", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "File is required"
    });
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.set("file", new Blob(["not an allowed upload"], { type: "text/plain" }), "notes.txt");

    const response = await postUpload(baseUrl, form);
    const payload = await response.json();

    assert.equal(response.status, 415);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});

test("POST /api/uploads rejects oversized files", async () => {
  await withServer(async (baseUrl) => {
    const oversizedBytes = new Uint8Array(5 * 1024 * 1024 + 1);
    const form = new FormData();
    form.set("file", new Blob([oversizedBytes], { type: "image/png" }), "oversized.png");

    const response = await postUpload(baseUrl, form);
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "File exceeds maximum size of 5MB"
    });
  });
});

test("POST /api/uploads accepts valid small image uploads", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "avatar.png");

    const response = await postUpload(baseUrl, form);
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
