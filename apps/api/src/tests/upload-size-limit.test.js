import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads returns error for oversized file", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create a file larger than 10MB
  const largeContent = Buffer.alloc(11 * 1024 * 1024, "a");
  const formData = new FormData();
  formData.append("file", new Blob([largeContent]), "large-file.txt");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  // Multer returns error for file too large
  assert.ok(response.status >= 400);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads returns error for disallowed file type", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create an executable file
  const content = Buffer.from("MZ...executable content");
  const formData = new FormData();
  formData.append("file", new Blob([content], { type: "application/x-executable" }), "malware.exe");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  assert.ok(response.status >= 400);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads accepts allowed file type", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create a PNG image
  const content = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
  const formData = new FormData();
  formData.append("file", new Blob([content], { type: "image/png" }), "image.png");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  assert.equal(response.status, 201);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
