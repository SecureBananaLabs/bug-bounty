import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Upload routes security and error handling suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const validToken = signAccessToken({ id: "usr_uploader", role: "freelancer" });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST /api/uploads without auth returns 401 Unauthorized", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/uploads with unexpected field returns 400 Bad Request", async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="avatar"; filename="avatar.png"',
      "Content-Type: image/png",
      "",
      "fake-image-binary-data",
      `--${boundary}--`,
      ""
    ].join("\r\n");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Unexpected field/i);
  });

  await t.test("POST /api/uploads with valid file field returns 201 Created", async () => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="document.pdf"',
      "Content-Type: application/pdf",
      "",
      "%PDF-1.4 dummy pdf content",
      `--${boundary}--`,
      ""
    ].join("\r\n");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "document.pdf");
    assert.equal(payload.data.status, "uploaded");
  });
});
