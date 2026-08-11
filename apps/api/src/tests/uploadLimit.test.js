import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, assertions) {
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

function createFormData(filename, content) {
  const form = new FormData();
  form.set("file", new Blob([content]), filename);
  return form;
}

test("POST /api/uploads rejects files over the configured size limit", async () => {
  await withServer(createApp({ uploadMaxFileSizeBytes: 4 }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: createFormData("large.txt", "12345")
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File too large. Max size is 4 bytes");
  });
});

test("POST /api/uploads still accepts files within the configured limit", async () => {
  await withServer(createApp({ uploadMaxFileSizeBytes: 8 }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: createFormData("small.txt", "1234")
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "small.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
