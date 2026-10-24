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

test("Upload request without file returns 400 File is required", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "File is required");
  });
});

test("Upload valid text file returns 201 and sanitized filename", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const blob = new Blob(["hello world content"], { type: "text/plain" });
    formData.append("file", blob, "my report (v1).txt");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "my_report__v1_.txt");
    assert.equal(body.data.status, "uploaded");
  });
});

test("Upload executable file returns 400", async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const blob = new Blob(["binary"], { type: "application/octet-stream" });
    formData.append("file", blob, "malicious.exe");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /prohibited/i);
  });
});
