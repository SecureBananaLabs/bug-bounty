import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createUploadForm() {
  const form = new FormData();
  form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
  return form;
}

test("POST /api/uploads rejects missing and invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: createUploadForm()
    });
    const invalid = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-valid-token" },
      body: createUploadForm()
    });

    assert.equal(missing.status, 401);
    assert.deepEqual(await missing.json(), {
      success: false,
      message: "Unauthorized"
    });

    assert.equal(invalid.status, 401);
    assert.deepEqual(await invalid.json(), {
      success: false,
      message: "Invalid token"
    });
  });
});

test("POST /api/uploads accepts files for valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_uploader", role: "client" });
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: createUploadForm()
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.filename, "hello.txt");
    assert.equal(payload.data.status, "uploaded");
  });
});
