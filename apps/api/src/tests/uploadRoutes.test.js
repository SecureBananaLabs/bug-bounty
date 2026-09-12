import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function fileForm(name, type, content) {
  const form = new FormData();
  form.set("file", new Blob([content], { type }), name);
  return form;
}

test("POST /api/uploads accepts allowlisted file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: fileForm("demo.png", "image/png", new Uint8Array([137, 80, 78, 71]))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "demo.png",
        status: "uploaded"
      }
    });
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: fileForm("script.sh", "text/x-shellscript", "echo unsafe")
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});

test("POST /api/uploads rejects files over the memory limit", async () => {
  await withServer(async (baseUrl) => {
    const oversizedFile = new Uint8Array(5 * 1024 * 1024 + 1);
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: fileForm("large.png", "image/png", oversizedFile)
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "File exceeds 5 MB upload limit"
    });
  });
});
