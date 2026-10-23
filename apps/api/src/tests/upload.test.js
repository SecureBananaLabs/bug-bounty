import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads returns 201 with valid file metadata", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const content = "Hello world from test upload";
    form.append("file", new Blob([content], { type: "text/plain" }), "hello.txt");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.filename, "hello.txt");
    assert.equal(body.data.size, Buffer.byteLength(content));
    assert.equal(body.data.mimetype, "text/plain");
    assert.equal(body.data.status, "uploaded");
  });
});

test("POST /api/uploads returns 400 when file is missing", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "File is required");
  });
});

test("POST /api/uploads sanitizes path traversal and malicious characters in filename", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["payload"], { type: "text/plain" }),
      "../../evil<script>alert(1)</script>file;name.txt"
    );

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.ok(!body.data.filename.includes("/"));
    assert.ok(!body.data.filename.includes("\\"));
    assert.ok(!body.data.filename.includes("<"));
    assert.ok(!body.data.filename.includes(">"));
    assert.match(body.data.filename, /^[a-zA-Z0-9._-]+$/);
  });
});

test("POST /api/uploads exceeding 10MB returns 400 with size error", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    const overLimitData = new Uint8Array(10 * 1024 * 1024 + 1024);
    form.append("file", new Blob([overLimitData], { type: "application/octet-stream" }), "large-file.bin");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.match(body.error, /File too large/i);
  });
});
