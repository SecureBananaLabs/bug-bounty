import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken() {
  return signAccessToken({ sub: "usr_uploads", role: "client" });
}

test("POST /api/uploads requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("authenticated POST /api/uploads works", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const form = new FormData();
    form.append("file", new Blob(["hello"]), "hello.txt");
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${createAuthToken()}` },
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
