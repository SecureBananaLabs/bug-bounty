import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects multipart requests without a file field", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("description", "metadata without a file");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Upload requires a multipart file field named file"
    });
  });
});

test("POST /api/uploads accepts a valid multipart file upload", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello upload"], { type: "text/plain" }), "proof.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "proof.txt",
        status: "uploaded"
      }
    });
  });
});
