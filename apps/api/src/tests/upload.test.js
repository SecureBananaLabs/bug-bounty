import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects missing file", async () => {
  await withServer(async (baseUrl) => {
    const body = new FormData();

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "File is required."
    });
  });
});

test("POST /api/uploads accepts a provided file", async () => {
  await withServer(async (baseUrl) => {
    const body = new FormData();
    body.append("file", new Blob(["hello"]), "hello.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body
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
  });
});
