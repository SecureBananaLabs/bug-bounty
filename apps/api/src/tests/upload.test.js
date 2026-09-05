import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("POST /api/uploads returns 201 when a file is provided", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Create a proper multipart request with FormData
  const boundary = "----testBoundary123";
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    "Content-Type: text/plain",
    "",
    "hello world",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.status, "uploaded");
  assert.equal(payload.data.filename, "test.txt");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads returns 400 when no file is provided", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Send JSON body (not multipart) — no file at all
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("file"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
