import assert from "node:assert/strict";
import test from "node:test";
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
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects requests without a file", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /file/i);
  });
});

test("POST /api/uploads accepts a file upload", async () => {
  await withServer(async (port) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
