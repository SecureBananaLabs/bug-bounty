import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(run) {
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

function formWithFile(blob, filename) {
  const form = new FormData();
  form.append("file", blob, filename);
  return form;
}

test("POST /api/uploads accepts allowed file types", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile(new Blob(["%PDF-1.4"], { type: "application/pdf" }), "sample.pdf")
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "sample.pdf");
    assert.equal(payload.data.status, "uploaded");
  });
});

test("POST /api/uploads rejects unsupported file types", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile(new Blob(["<script></script>"], { type: "text/html" }), "payload.html")
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported file type"
    });
  });
});

test("POST /api/uploads rejects files larger than 10 MB", async () => {
  await withTestServer(async (baseUrl) => {
    const oversizedFile = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], {
      type: "application/pdf"
    });
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formWithFile(oversizedFile, "oversized.pdf")
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "File exceeds 10 MB limit"
    });
  });
});
