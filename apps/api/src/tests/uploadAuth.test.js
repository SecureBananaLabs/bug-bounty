import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function writeTempFile() {
  const filePath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "securebanana-upload-")), "sample.txt");
  await fs.writeFile(filePath, "hello world");
  return filePath;
}

test("POST /api/uploads rejects unauthenticated callers before multer runs", async () => {
  await withServer(async (baseUrl) => {
    const filePath = await writeTempFile();
    const form = new FormData();
    form.set("file", new Blob([await fs.readFile(filePath)]), "sample.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/uploads keeps the existing response for authenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const filePath = await writeTempFile();
    const form = new FormData();
    form.set("file", new Blob([await fs.readFile(filePath)]), "sample.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signAccessToken({ sub: "usr_test", role: "client" })}`
      },
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "uploaded");
    assert.equal(payload.data.filename, "sample.txt");
  });
});
