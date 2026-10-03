import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("POST /api/uploads accepts an image within the 5 MiB limit", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "image.png");

    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "image.png");
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["not an image"], { type: "text/plain" }), "notes.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type. Only images are allowed."
    });
  });
});

test("POST /api/uploads rejects files larger than 5 MiB", async () => {
  await withServer(async (baseUrl) => {
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
    const form = new FormData();
    form.append("file", new Blob([oversized], { type: "image/png" }), "large.png");

    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "File too large. Maximum size is 5 MiB."
    });
  });
});
