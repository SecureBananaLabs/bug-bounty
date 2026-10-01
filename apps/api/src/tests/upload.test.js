import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_UPLOAD_BYTES } from "../routes/uploadRoutes.js";

async function withTestServer(run) {
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

test("POST /api/uploads rejects requests without a file", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: new FormData()
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "File is required"
    });
  });
});

test("POST /api/uploads accepts a single file", async () => {
  await withTestServer(async (baseUrl) => {
    const body = new FormData();
    body.set("file", new File(["hello"], "hello.txt", { type: "text/plain" }));

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "hello.txt",
      size: 5,
      status: "uploaded"
    });
  });
});

test("POST /api/uploads rejects files over the configured limit", async () => {
  await withTestServer(async (baseUrl) => {
    const body = new FormData();
    body.set(
      "file",
      new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "too-large.bin", {
        type: "application/octet-stream"
      })
    );

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "File exceeds the 5 MB upload limit"
    });
  });
});
