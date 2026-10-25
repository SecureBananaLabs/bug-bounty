import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads sanitizes filename", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Construct a multipart/form-data payload manually
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="../../../etc/passwd"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `file content\r\n`;
  body += `--${boundary}--\r\n`;

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });
  
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.filename, "passwd");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
