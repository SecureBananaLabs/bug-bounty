import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/uploads rejects requests without a file field", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const form = new FormData();
    form.append("description", "missing file regression case");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "A file field is required for uploads"
    });
  } finally {
    await close(server);
  }
});

test("POST /api/uploads accepts multipart requests with a file field", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const form = new FormData();
    form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "hello.txt",
        status: "uploaded"
      }
    });
  } finally {
    await close(server);
  }
});
