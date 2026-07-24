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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects requests without a file", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "File is required" });
  });
});

test("POST /api/uploads accepts multipart file uploads", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    formData.append("file", new Blob(["hello"]), "hello.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
