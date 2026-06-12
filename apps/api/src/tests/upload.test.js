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

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function fileFormData() {
  const form = new FormData();
  form.append("file", new Blob(["test upload"], { type: "text/plain" }), "sample.txt");
  return form;
}

function authorizationHeader() {
  const token = signAccessToken({ sub: "usr_test", role: "client" });
  return `Bearer ${token}`;
}

test("POST /api/uploads rejects unauthenticated uploads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: fileFormData()
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/uploads rejects uploads with an invalid token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
      body: fileFormData()
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});

test("POST /api/uploads accepts authenticated uploads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: authorizationHeader() },
      body: fileFormData()
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "sample.txt",
        status: "uploaded"
      }
    });
  });
});

test("POST /api/uploads preserves authenticated no-file behavior", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: authorizationHeader() }
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: null,
        status: "no-file"
      }
    });
  });
});
