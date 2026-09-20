import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads returns 400 when no file is provided", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data" },
    body: new FormData()
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "No file provided");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads returns 201 when file is provided", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const formData = new FormData();
  formData.append("file", new Blob(["test content"]), "test.txt");
  
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.status, "uploaded");
  assert.equal(payload.data.filename, "test.txt");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
