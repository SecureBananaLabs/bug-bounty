import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startApp(t) {
  const server = createApp().listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  return `http://127.0.0.1:${server.address().port}`;
}

test("POST /api/uploads rejects requests without file with 400 Bad Request", async (t) => {
  const baseUrl = await startApp(t);
  const res = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
  });
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.equal(json.success, false);
  assert.equal(json.message, "No file uploaded");
});

test("POST /api/uploads rejects multipart request missing the file field with 400", async (t) => {
  const baseUrl = await startApp(t);
  const formData = new FormData();
  formData.append("title", "sample document");
  const res = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.equal(json.success, false);
  assert.equal(json.message, "No file uploaded");
});

test("POST /api/uploads accepts valid file upload and returns 201 with uploaded status", async (t) => {
  const baseUrl = await startApp(t);
  const formData = new FormData();
  const fileBlob = new Blob(["Sample file content"], { type: "text/plain" });
  formData.append("file", fileBlob, "sample_document.txt");

  const res = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.filename, "sample_document.txt");
  assert.equal(json.data.status, "uploaded");
});
