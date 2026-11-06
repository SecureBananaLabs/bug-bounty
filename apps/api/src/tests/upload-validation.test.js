import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts allowed file types under the size limit", async () => {
  await withServer(async (port) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from("hello world")], { type: "application/pdf" }),
      "document.pdf"
    );

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "document.pdf");
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (port) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from("MZ")], { type: "application/octet-stream" }),
      "malware.exe"
    );

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid file type");
  });
});

test("POST /api/uploads rejects files larger than 5MB", async () => {
  await withServer(async (port) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.alloc(5 * 1024 * 1024 + 1, 0x61)], { type: "application/pdf" }),
      "large.pdf"
    );

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File too large");
  });
});
