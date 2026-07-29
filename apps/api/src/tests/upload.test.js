import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/uploads`;

  await t.test("rejects request without a file field", async () => {
    const formData = new FormData();
    const response = await fetch(baseUrl, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "No file uploaded");
  });

  await t.test("accepts request with a valid file field", async () => {
    const formData = new FormData();
    const blob = new Blob(["test file content"], { type: "text/plain" });
    formData.append("file", blob, "hello.txt");

    const response = await fetch(baseUrl, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "hello.txt",
      status: "uploaded"
    });
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
