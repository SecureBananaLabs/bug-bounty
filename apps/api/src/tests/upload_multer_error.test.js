import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads with unexpected field returns 400 Bad Request", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="avatar"; filename="avatar.png"',
    "Content-Type: image/png",
    "",
    "fake-image-binary-data",
    `--${boundary}--`,
    ""
  ].join("\r\n");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /Unexpected field/i);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
