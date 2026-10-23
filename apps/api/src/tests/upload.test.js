import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

beforeEach(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
});

test("POST /api/uploads with valid file returns 201 and sanitized filename", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["hello world content"], { type: "text/plain" }), "sample.txt");

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "sample.txt");
  assert.equal(payload.data.status, "uploaded");
  assert.equal(payload.data.size, 19);
  assert.equal(payload.data.mimetype, "text/plain");
});

test("POST /api/uploads without file returns 400 and error message", async () => {
  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST"
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "File is required" });
});

test("POST /api/uploads with empty form data (no file part) returns 400", async () => {
  const formData = new FormData();
  formData.append("title", "no-file-here");

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "File is required" });
});

test("POST /api/uploads sanitizes path traversal in filename", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["malicious payload"], { type: "text/plain" }),
    "../../etc/passwd"
  );

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "passwd");
});

test("POST /api/uploads sanitizes Windows path traversal in filename", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["malicious payload"], { type: "image/png" }),
    "..\\secret.png"
  );

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "secret.png");
});

test("POST /api/uploads rejects oversized file (> 10MB) with 400", async () => {
  const oversizeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([oversizeBuffer], { type: "application/octet-stream" }),
    "large_file.bin"
  );

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "File exceeds 10MB limit" });
});
