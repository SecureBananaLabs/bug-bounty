import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withTestServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads rejects unauthenticated requests", async () => {
  await withTestServer(async (baseUrl) => {
    const form = new FormData();
    form.append("file", new Blob(["sample upload"]), "sample.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/uploads accepts valid bearer tokens", async () => {
  await withTestServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_upload", role: "client" });
    const form = new FormData();
    form.append("file", new Blob(["sample upload"]), "sample.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: { filename: "sample.txt", status: "uploaded" }
    });
  });
});
