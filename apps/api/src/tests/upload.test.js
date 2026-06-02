import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads handles file uploads correctly", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("rejects upload without file field", async () => {
    const formData = new FormData();
    formData.append("otherField", "test");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "No file uploaded" });
  });

  await t.test("accepts valid file upload", async () => {
    const formData = new FormData();
    const blob = new Blob(["test file content"], { type: "text/plain" });
    formData.append("file", blob, "test.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "test.txt");
    assert.equal(payload.data.status, "uploaded");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
