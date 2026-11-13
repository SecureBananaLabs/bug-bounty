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

test("POST /api/uploads rejects a request without a file field", async () => {
  await withServer(async (base) => {
    const body = new FormData();
    body.append("note", "no file here");

    const response = await fetch(`${base}/api/uploads`, { method: "POST", body });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("POST /api/uploads still accepts a real file", async () => {
  await withServer(async (base) => {
    const body = new FormData();
    body.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");

    const response = await fetch(`${base}/api/uploads`, { method: "POST", body });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
