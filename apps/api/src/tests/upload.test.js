import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads without file returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  const formData = new FormData();
  formData.append("other", "value");
  
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });
  
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "No file provided");
  
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/uploads with file returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  const formData = new FormData();
  const blob = new Blob(["test file content"], { type: "text/plain" });
  formData.append("file", blob, "test.txt");
  
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });
  
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.status, "uploaded");
  assert.equal(payload.filename, "test.txt");
  
  await new Promise((resolve) => server.close(resolve));
});

