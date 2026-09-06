import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads with small file returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const form = new FormData();
  form.append("file", new Blob(["hello"]), "test.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });

  assert.equal(res.status, 201, "Small file should be accepted");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads without file returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 201, "No file should return 201 with no-file status");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
