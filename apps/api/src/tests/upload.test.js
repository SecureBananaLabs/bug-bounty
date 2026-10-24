import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function makeUploadRequest(formData) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads without file returns 400 Bad Request", async () => {
  const formData = new FormData();
  const { status, data } = await makeUploadRequest(formData);

  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "File is required");
});

test("POST /api/uploads with valid text file returns 201 and uploaded status", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["test file content"], { type: "text/plain" }), "document.txt");
  const { status, data } = await makeUploadRequest(formData);

  assert.equal(status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.filename, "document.txt");
  assert.equal(data.data.status, "uploaded");
  assert.ok(data.data.size > 0);
});

test("POST /api/uploads with executable extension (.sh) returns 400 Bad Request", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["#!/bin/bash\necho evil"], { type: "text/plain" }), "script.sh");
  const { status, data } = await makeUploadRequest(formData);

  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Executable file types are not allowed");
});

test("POST /api/uploads with executable extension (.exe) returns 400 Bad Request", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["MZ..."], { type: "application/octet-stream" }), "binary.exe");
  const { status, data } = await makeUploadRequest(formData);

  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Executable file types are not allowed");
});

test("POST /api/uploads with file exceeding 10MB limit returns 400 Bad Request", async () => {
  const bigChunk = new Uint8Array(10 * 1024 * 1024 + 1024); // 10MB + 1KB
  const formData = new FormData();
  formData.append("file", new Blob([bigChunk], { type: "application/octet-stream" }), "huge.dat");
  const { status, data } = await makeUploadRequest(formData);

  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "File too large. Maximum size is 10MB");
});
