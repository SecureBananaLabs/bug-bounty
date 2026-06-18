import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// 快速启动一个测试用的服务实例
async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { port, close: () => new Promise((r) => server.close(r)) };
}

test("POST /api/uploads accepts a valid image file", async () => {
  const { port, close } = await startApp();

  const form = new FormData();
  form.append("file", new Blob(["fake-png-content"], { type: "image/png" }), "test.png");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);

  await close();
});

test("POST /api/uploads rejects disallowed file type", async () => {
  const { port, close } = await startApp();

  // 试一个可执行文件类型，应该被拦
  const form = new FormData();
  form.append("file", new Blob(["malware"], { type: "application/x-msdownload" }), "evil.exe");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close();
});