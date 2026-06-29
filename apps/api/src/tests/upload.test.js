import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { uploadFileSizeLimit } from "../routes/uploadRoutes.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts a small file", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "note.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, { filename: "note.txt", status: "uploaded" });
  });
});

test("POST /api/uploads rejects oversized files with 413", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(uploadFileSizeLimit + 1)]),
      "too-large.bin"
    );

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Uploaded file exceeds the size limit");
  });
});
