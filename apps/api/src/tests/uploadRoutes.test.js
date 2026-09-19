import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "../routes/uploadRoutes.js";

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

function uploadBody(size) {
  const form = new FormData();
  form.set("file", new Blob([Buffer.alloc(size, "a")]), "upload.txt");
  return form;
}

test("POST /api/uploads rejects files above the memory upload limit", async () => {
  await withServer(async (baseUrl) => {
    const small = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: uploadBody(16)
    });
    const smallPayload = await small.json();

    assert.equal(small.status, 201);
    assert.equal(smallPayload.data.filename, "upload.txt");
    assert.equal(smallPayload.data.status, "uploaded");

    const oversized = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: uploadBody(MAX_UPLOAD_FILE_SIZE_BYTES + 1)
    });
    const oversizedPayload = await oversized.json();

    assert.equal(oversized.status, 413);
    assert.equal(oversizedPayload.success, false);
    assert.equal(oversizedPayload.message, "Uploaded file exceeds the size limit");
  });
});
