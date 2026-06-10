import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects empty multipart requests", async () => {
  await withServer(async (baseUrl) => {
    const emptyForm = new FormData();
    const emptyResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: emptyForm
    });
    const emptyPayload = await emptyResponse.json();

    assert.equal(emptyResponse.status, 400);
    assert.deepEqual(emptyPayload, { success: false, message: "File is required" });
  });
});

test("POST /api/uploads accepts a multipart file", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, { filename: "hello.txt", status: "uploaded" });
  });
});
