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

  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads with no file returns 400", async () => {
  await withServer(async (base) => {
    const form = new FormData();
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /file/i);
  });
});

test("POST /api/uploads with a file returns 201 success payload", async () => {
  await withServer(async (base) => {
    const form = new FormData();
    form.append("file", new Blob(["hello world"], { type: "text/plain" }), "hello.txt");
    const response = await fetch(`${base}/api/uploads`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
