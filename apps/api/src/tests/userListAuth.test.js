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

  const { port } = server.address();

  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/users rejects anonymous requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/users allows authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/users`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});
