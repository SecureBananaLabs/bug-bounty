import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_UPLOAD_BYTES } from "../routes/uploadRoutes.js";

const withTestServer = async (run) => {
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
};

test("POST /api/uploads accepts files within the memory limit", async () => {
  await withTestServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "note.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "note.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects files over the memory limit", async () => {
  await withTestServer(async (baseUrl) => {
    const form = new FormData();
    const tooLargeFile = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    form.append("file", new Blob([tooLargeFile]), "large.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, { success: false, message: "File too large" });
  });
});
