import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function makeMultipartBody(fields, fileField, fileBuffer, filename, mimeType) {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    ));
  }

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return Buffer.concat(parts);
}

test("POST /api/uploads with valid file returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const pdfContent = Buffer.from("%PDF-1.4 fake pdf content");
  const body = makeMultipartBody({}, "file", pdfContent, "doc.pdf", "application/pdf");
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${body.toString().split("\r\n")[0].replace("--", "")}` },
    body
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "doc.pdf");
  assert.equal(payload.data.status, "uploaded");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with no file returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: ""
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with disallowed mime type returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const exeContent = Buffer.from("MZ...executable");
  const body = makeMultipartBody({}, "file", exeContent, "malware.exe", "application/x-msdownload");
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
