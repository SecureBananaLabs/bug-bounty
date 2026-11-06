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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects files over the configured limit", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const oversizedPayload = new Uint8Array((5 * 1024 * 1024) + 1);

    formData.append("file", new Blob([oversizedPayload]), "too-large.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Uploaded file exceeds the 5 MB limit"
    });
  });
});

test("POST /api/uploads still accepts files within the configured limit", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();

    formData.append("file", new Blob([new Uint8Array(1024)]), "small.bin");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "small.bin",
        status: "uploaded"
      }
    });
  });
});
