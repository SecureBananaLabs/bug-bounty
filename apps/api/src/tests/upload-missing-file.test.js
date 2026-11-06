import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads returns 400 when no file is provided", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST"
  });
  assert.equal(res.status, 400, "missing file must return 400");
  const body = await res.json();
  assert.equal(body.success, false);
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});

test("missing file response has no-file status replaced by 400 error", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST"
  });
  assert.notEqual(res.status, 201, "missing file must not return 201");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
