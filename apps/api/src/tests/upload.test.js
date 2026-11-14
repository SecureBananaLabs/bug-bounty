import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("POST /api/uploads without file is rejected (400)", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    form.append("note", "no file here");
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: "POST",
      body: form,
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  } finally {
    await server.close();
  }
});

test("POST /api/uploads with file succeeds (201)", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");
    const response = await fetch(`${server.baseUrl}/api/uploads`, {
      method: "POST",
      body: form,
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  } finally {
    await server.close();
  }
});
