import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/uploads rejects multipart requests without a file", async () => {
  const { baseUrl, server } = await listen(createApp());
  const form = new FormData();
  form.append("description", "empty upload");

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "File is required."
  });

  await close(server);
});

test("POST /api/uploads accepts multipart requests with a file", async () => {
  const { baseUrl, server } = await listen(createApp());
  const form = new FormData();
  form.append("file", new Blob(["hello"]), "hello.txt");

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload, {
    success: true,
    data: {
      filename: "hello.txt",
      status: "uploaded"
    }
  });

  await close(server);
});
