import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function formWithFile(fileSize) {
  const form = new FormData();
  form.append("file", new Blob(["x".repeat(fileSize)], { type: "text/plain" }), "upload.txt");
  return form;
}

test("POST /api/uploads rejects files over five megabytes", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formWithFile(5 * 1024 * 1024 + 1),
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, { success: false, message: "File too large" });
  });
});

test("POST /api/uploads still accepts small files", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formWithFile(16),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "upload.txt");
  });
});
