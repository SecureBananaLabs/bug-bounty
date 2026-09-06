import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function createFormData(filename, content) {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const parts = [];
  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`);
  parts.push(`Content-Type: application/octet-stream\r\n\r\n`);
  parts.push(content);
  parts.push(`\r\n--${boundary}--\r\n`);
  const body = parts.join("");
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.from(body, "utf-8")
  };
}

test("POST /api/uploads with small file returns 200", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const smallContent = "x".repeat(1024); // 1 KB
  const { contentType, body } = createFormData("small.txt", smallContent);

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body
  });

  assert.equal(response.status, 201);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with oversized file returns 413", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const largeContent = "x".repeat(6 * 1024 * 1024); // 6 MB (exceeds 5 MB limit)
  const { contentType, body } = createFormData("large.txt", largeContent);

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body
  });
  const payload = await response.json();

  assert.equal(response.status, 413);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("too large") || payload.message.toLowerCase().includes("maximum"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads without file returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Send multipart request without a file field
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const body = Buffer.from(`--${boundary}--\r\n`, "utf-8");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("no file"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
