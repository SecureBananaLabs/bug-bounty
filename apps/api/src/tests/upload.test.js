import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function postUpload({ filename, mimetype, content }) {
  const form = new FormData();
  form.set(
    "file",
    new Blob([content], { type: mimetype }),
    filename
  );

  return fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: form
  });
}

test("POST /api/uploads accepts a whitelisted PDF upload", async () => {
  const response = await postUpload({
    filename: "architecture.pdf",
    mimetype: "application/pdf",
    content: "%PDF-1.7\nsecure upload regression fixture\n"
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    success: true,
    data: {
      filename: "architecture.pdf",
      status: "uploaded"
    }
  });
});

test("POST /api/uploads rejects a request without a file", async () => {
  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: new FormData()
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "No file provided"
  });
});

test("POST /api/uploads rejects files larger than 10MB", async () => {
  const oversizedContent = Buffer.alloc((10 * 1024 * 1024) + 1, 0x61);

  const response = await postUpload({
    filename: "oversized.txt",
    mimetype: "text/plain",
    content: oversizedContent
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "File exceeds the 10MB limit"
  });
});

test("POST /api/uploads rejects executable extensions even when MIME claims text/plain", async () => {
  const response = await postUpload({
    filename: "deploy.sh",
    mimetype: "text/plain",
    content: "#!/bin/sh\necho unsafe\n"
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message:
      "Unsupported file type. Allowed types are PNG, JPEG, WebP, GIF, PDF, and TXT."
  });
});
