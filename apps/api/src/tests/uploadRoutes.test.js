import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("upload file size validation", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    // Too-large file → MulterError (LIMIT_FILE_SIZE)
    const blob = new Blob([Buffer.alloc(6 * 1024 * 1024)], { type: "image/jpeg" });
    const form = new FormData();
    form.append("file", blob, "large.jpg");
    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    assert.equal(res.status, 400, "file >5MB should be rejected");
  } finally {
    await new Promise((r) => server.close(r));
  }
});
