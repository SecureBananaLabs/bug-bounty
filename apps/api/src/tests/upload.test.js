import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads without file returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Send multipart request WITHOUT a file field
  const formData = new FormData();
  formData.append("name", "test-upload");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.includes("No file provided"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with empty body returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Send multipart request with NO fields at all
  const formData = new FormData();

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(payload.message.includes("No file provided"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with file returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Create a proper file upload
  const formData = new FormData();
  const fileContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const file = new File([fileContent], "test.txt", { type: "text/plain" });
  formData.append("file", file);

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "test.txt");
  assert.equal(payload.data.status, "uploaded");
  assert.ok(payload.data.size > 0);
  assert.equal(payload.data.mimetype, "text/plain");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads with wrong field name returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Send file with wrong field name (not "file")
  const formData = new FormData();
  const fileContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const file = new File([fileContent], "test.txt", { type: "text/plain" });
  formData.append("document", file); // Wrong field name

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  // Multer rejects unexpected fields with 400 via error handler
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(
    payload.message.includes("Unexpected field") || 
    payload.message.includes("File upload error"),
    `Expected multer error message, got: ${payload.message}`
  );

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
