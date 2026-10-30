import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects a multipart request without file", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("description", "no file was supplied");
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "File is required"
    });
  });
});

test("POST /api/uploads retains 201 success for a valid file", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      success: true,
      data: { filename: "hello.txt", status: "uploaded" }
    });
  });
});
