import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_FILENAME_LENGTH, sanitizeFilename } from "../utils/filename.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function upload(server, filename) {
  const boundary = "abc123";
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    "Content-Type: text/plain",
    "",
    "hello",
    `--${boundary}--`,
    ""
  ].join("\r\n");

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: "POST",
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body
  });

  return response.json();
}

test("sanitizeFilename keeps the last path segment", () => {
  assert.equal(sanitizeFilename("reports/nested/invoice-2024.pdf"), "invoice-2024.pdf");
  assert.equal(sanitizeFilename("C:\\tmp\\logo.png"), "logo.png");
});

test("sanitizeFilename strips control characters and caps length", () => {
  assert.equal(sanitizeFilename("  a\u0000b\u001fc\t"), "abc");
  assert.equal(sanitizeFilename("x".repeat(400)).length, MAX_FILENAME_LENGTH);
  assert.equal(sanitizeFilename("   "), null);
  assert.equal(sanitizeFilename(undefined), null);
});

test("POST /api/uploads answers with a sanitized filename", async () => {
  const server = await listen(createApp());
  const payload = await upload(server, "uploads/sub-dir/monthly_report.csv");

  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "monthly_report.csv");
  assert.equal(payload.data.status, "uploaded");

  await close(server);
});

test("POST /api/uploads without a file still reports no-file", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads`, {
    method: "POST",
    body: new FormData()
  });
  const payload = await response.json();

  assert.equal(payload.data.filename, null);
  assert.equal(payload.data.status, "no-file");

  await close(server);
});
