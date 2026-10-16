import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "test-secret";

const { createApp } = await import("../app.js");
const { env } = await import("../config/env.js");

// Lightweight integration test over the real app router using supertest-free fetch
async function withServer(run) {
  const { server } = await import("../server.js");
  await new Promise((resolve) => server.listen(env.port, resolve));
  try {
    await run(`http://127.0.0.1:${env.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("POST /api/uploads rejects requests with no file field (400)", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nothing: true })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /no file/i);
  });
});

test("POST /api/uploads accepts a real file (201, success:true)", async () => {
  await withServer(async (base) => {
    const form = new FormData();
    form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
    const res = await fetch(`${base}/api/uploads`, { method: "POST", body: form });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, "uploaded");
    assert.equal(body.data.filename, "hello.txt");
  });
});

test("POST /api/uploads rejects an empty multipart body (400)", async () => {
  await withServer(async (base) => {
    const form = new FormData();
    form.append("notfile", "x");
    const res = await fetch(`${base}/api/uploads`, { method: "POST", body: form });
    assert.equal(res.status, 400);
  });
});
