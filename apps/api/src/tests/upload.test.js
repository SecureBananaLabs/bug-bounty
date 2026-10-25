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

test("POST /api/uploads rejects missing file", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File is required");
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.set("file", new Blob(["hello"], { type: "text/plain" }), "note.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 415);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unsupported file type");
  });
});

test("POST /api/uploads rejects oversized files", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const oversizedContent = "a".repeat(5 * 1024 * 1024 + 1);
    form.set("file", new Blob([oversizedContent], { type: "application/pdf" }), "large.pdf");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File is too large");
  });
});

test("POST /api/uploads accepts valid small files", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.set("file", new Blob(["%PDF-1.4"], { type: "application/pdf" }), "resume.pdf");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "resume.pdf",
      status: "uploaded"
    });
  });
});
