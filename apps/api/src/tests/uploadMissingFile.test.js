import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("uploads: request without a file field is rejected with 400", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const form = new FormData();
    form.append("description", "no file here");
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "No file provided");
  });
});

test("uploads: empty multipart body is rejected with 400", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const form = new FormData();
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("uploads: request with a file is accepted with 201 and uploaded status", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const form = new FormData();
    form.append("file", new Blob(["hello world"], { type: "text/plain" }), "hello.txt");
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "uploaded");
    assert.equal(payload.data.filename, "hello.txt");
  });
});

test("uploads: missing-file response is not reported as a successful upload", async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const form = new FormData();
    form.append("description", "still no file");
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form
    });
    assert.notEqual(response.status, 201);
    const payload = await response.json();
    assert.notEqual(payload.data?.status, "no-file");
  });
});
