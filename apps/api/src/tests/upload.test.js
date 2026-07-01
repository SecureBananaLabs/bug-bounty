import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads rejects request without file with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test-boundary" },
    body: "--test-boundary\r\nContent-Disposition: form-data; name=\"not-file\"\r\n\r\nhello\r\n--test-boundary--"
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads accepts request with file and returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Build a proper multipart request with a file
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const fileName = "test.txt";
  const fileContent = "hello world";
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
    "Content-Type: text/plain",
    "",
    fileContent,
    `--${boundary}--`
  ].join("\r\n");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, fileName);
  assert.equal(payload.data.status, "uploaded");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
