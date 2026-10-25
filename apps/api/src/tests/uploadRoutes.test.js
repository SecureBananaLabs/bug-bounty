import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects anonymous uploads before parsing files", async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["payload"]), "payload.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/uploads allows authenticated uploads", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_uploader", role: "client" });
    const form = new FormData();
    form.append("file", new Blob(["payload"]), "payload.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "payload.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
