import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  return new Promise((resolve, reject) => {
    const app = createApp();
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

test("POST /api/uploads without file returns 400", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "No file provided");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/uploads with empty multipart returns 400", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    // No file field attached
    form.append("description", "test upload");

    const res = await fetch(`${baseUrl(server)}/api/uploads`, {
      method: "POST",
      body: form,
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  } finally {
    await closeServer(server);
  }
});
