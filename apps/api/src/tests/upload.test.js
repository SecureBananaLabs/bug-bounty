import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Upload endpoint validation suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const uploadUrl = `http://127.0.0.1:${port}/api/uploads`;

  await t.test("POST /api/uploads with valid image file should succeed", async () => {
    const formData = new FormData();
    const fileBlob = new Blob(["dummy png data"], { type: "image/png" });
    formData.append("file", fileBlob, "test-avatar.png");

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "test-avatar.png");
    assert.equal(payload.data.status, "uploaded");
  });

  await t.test("POST /api/uploads with empty/missing file should be rejected with 400", async () => {
    const formData = new FormData();
    // No file appended

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "File is required");
  });

  await t.test("POST /api/uploads with invalid mime type should be rejected with 400", async () => {
    const formData = new FormData();
    const fileBlob = new Blob(["console.log('malicious script')"], { type: "application/javascript" });
    formData.append("file", fileBlob, "malicious.js");

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Only JPEG, PNG, GIF, PDF, and DOC\/DOCX files are allowed/);
  });

  await t.test("POST /api/uploads with oversized file should be rejected with 400", async () => {
    const formData = new FormData();
    // Generate a file larger than 5MB (e.g. 5.1MB)
    const largeBuffer = new Uint8Array(5.1 * 1024 * 1024);
    const fileBlob = new Blob([largeBuffer], { type: "image/jpeg" });
    formData.append("file", fileBlob, "huge.jpg");

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /File too large/i);
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
