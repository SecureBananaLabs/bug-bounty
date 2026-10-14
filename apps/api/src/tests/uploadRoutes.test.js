import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads returns 413 for oversized file", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create a 6MB string
  const largeContent = "a".repeat(6 * 1024 * 1024);
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="large.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `${largeContent}\r\n`;
  body += `--${boundary}--\r\n`;

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { 
      "Content-Type": `multipart/form-data; boundary=${boundary}` 
    },
    body: body,
  });
  
  const payload = await response.json();

  assert.equal(response.status, 413);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Payload Too Large");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
