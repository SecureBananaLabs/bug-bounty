import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Upload Route: POST /api/uploads validation", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/uploads`;

  try {
    // 1. Invalid upload: Missing file
    const formData1 = new FormData();
    const resp1 = await fetch(baseUrl, {
      method: "POST",
      body: formData1
    });
    assert.equal(resp1.status, 400);
    const payload1 = await resp1.json();
    assert.equal(payload1.success, false);
    assert.equal(payload1.message, "File is required");

    // 2. Valid upload: With file
    const formData2 = new FormData();
    formData2.append(
      "file",
      new Blob(["dummy file contents"], { type: "text/plain" }),
      "dummy.txt"
    );
    const resp2 = await fetch(baseUrl, {
      method: "POST",
      body: formData2
    });
    assert.equal(resp2.status, 201);
    const payload2 = await resp2.json();
    assert.equal(payload2.success, true);
    assert.equal(payload2.data.filename, "dummy.txt");
    assert.equal(payload2.data.status, "uploaded");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
