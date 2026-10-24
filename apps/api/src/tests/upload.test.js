import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

test("upload endpoint rejects missing files", async () => {
  const server = await startApp();
  const { port } = server.address();

  const form = new FormData();
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.message, "File required");

  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

test("upload endpoint rejects unsupported types and oversized files", async () => {
  const server = await startApp();
  const { port } = server.address();

  const badTypeForm = new FormData();
  badTypeForm.append("file", new Blob(["<html></html>"], { type: "text/html" }), "page.html");
  const badTypeResponse = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: badTypeForm
  });
  const badTypePayload = await badTypeResponse.json();
  assert.equal(badTypeResponse.status, 400);
  assert.equal(badTypePayload.message, "Unsupported file type");

  const largeBlob = new Blob([Buffer.alloc(11 * 1024 * 1024)], { type: "image/png" });
  const largeForm = new FormData();
  largeForm.append("file", largeBlob, "big.png");
  const largeResponse = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: largeForm
  });
  const largePayload = await largeResponse.json();
  assert.equal(largeResponse.status, 413);
  assert.equal(largePayload.message, "Request body too large");

  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});
