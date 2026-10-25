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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/uploads requires auth and accepts authenticated uploads", async () => {
  await withServer(async (baseUrl) => {
    const unauthenticatedRes = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST"
    });

    assert.equal(unauthenticatedRes.status, 401);

    const token = signAccessToken({ sub: "usr_upload", role: "client" });
    const body = new FormData();
    body.append("file", new Blob(["hello upload"], { type: "text/plain" }), "hello.txt");

    const authenticatedRes = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body
    });
    const payload = await authenticatedRes.json();

    assert.equal(authenticatedRes.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      filename: "hello.txt",
      status: "uploaded"
    });
  });
});
