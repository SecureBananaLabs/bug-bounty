import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Upload API Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/uploads with valid file returns 201", async () => {
    const formData = new FormData();
    const blob = new Blob(["hello world"], { type: "text/plain" });
    formData.append("file", blob, "test.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "test.txt");
    assert.equal(payload.data.status, "uploaded");
  });

  await t.test("POST /api/uploads with missing file returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.toLowerCase().includes("required") || payload.message.toLowerCase().includes("file"));
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
