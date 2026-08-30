import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads maps unexpected file field to HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Submit multipart form data with unexpected field name
    const form = new FormData();
    form.append("invalid_field", new Blob(["test content"], { type: "text/plain" }), "test.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Unexpected field/i);

    // 2. Submit multipart form data with valid field name
    const validForm = new FormData();
    validForm.append("file", new Blob(["hello world"], { type: "text/plain" }), "hello.txt");

    const validResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: validForm
    });

    const validPayload = await validResponse.json();

    assert.equal(validResponse.status, 201);
    assert.equal(validPayload.success, true);
    assert.equal(validPayload.data.filename, "hello.txt");
    assert.equal(validPayload.data.status, "uploaded");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
