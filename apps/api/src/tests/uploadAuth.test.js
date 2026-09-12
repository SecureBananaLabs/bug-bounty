import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function uploadBody() {
  const form = new FormData();
  form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
  return form;
}

async function postUpload(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers,
    body: uploadBody()
  });
}

test("POST /api/uploads rejects unauthenticated uploads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/uploads rejects invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await postUpload(baseUrl, "not-a-valid-token");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("POST /api/uploads accepts valid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_uploader", role: "freelancer" });
    const response = await postUpload(baseUrl, token);
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body, {
      success: true,
      data: {
        filename: "hello.txt",
        status: "uploaded"
      }
    });
  });
});
