import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/uploads file size limit", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("accepts small file uploads", async () => {
    const formData = new FormData();
    const smallBlob = new Blob([new Uint8Array(100)], { type: "text/plain" });
    formData.append("file", smallBlob, "small.txt");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    assert.equal(res.status, 201);
  });

  await t.test("rejects oversized file uploads with 413", async () => {
    const formData = new FormData();
    const largeBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: "application/octet-stream" });
    formData.append("file", largeBlob, "large.bin");

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.toLowerCase().includes("large") || body.message.toLowerCase().includes("limit"));
  });
});
