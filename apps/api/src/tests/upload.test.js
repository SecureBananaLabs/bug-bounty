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
  const url = "http://127.0.0.1:" + port + "/api/uploads";
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=testboundary" },
    body: "--testboundary\r\nContent-Disposition: form-data; name=\"not-a-file\"\r\n\r\nhello\r\n--testboundary--"
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
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
  const url = "http://127.0.0.1:" + port + "/api/uploads";
  const boundary = "----boundary123";
  const body = [
    "--" + boundary,
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    "Content-Type: text/plain",
    "",
    "hello world",
    "--" + boundary + "--"
  ].join("\r\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=" + boundary },
    body
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.status, "uploaded");
  assert.equal(payload.data.filename, "test.txt");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
