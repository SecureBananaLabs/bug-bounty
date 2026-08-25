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
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads returns 400 when no file is provided", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/uploads`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message);
  });
});

test("POST /api/uploads returns 201 when file is provided", async () => {
  await withServer(async (base) => {
    const body = new FormData();
    const blob = new Blob(["hello, world!"], { type: "text/plain" });
    body.append("file", blob, "test.txt");

    const response = await fetch(`${base}/api/uploads`, { method: "POST", body });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "test.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
