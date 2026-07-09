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

  const { port } = server.address();

  try {
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads accepts allowed file type", async () => {
  await withServer(async (port) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["pdf-content"], { type: "application/pdf" }),
      "sample.pdf"
    );

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "sample.pdf");
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects non-whitelisted file type with stable error", async () => {
  await withServer(async (port) => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["plain-text"], { type: "text/plain" }),
      "sample.txt"
    );

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});
