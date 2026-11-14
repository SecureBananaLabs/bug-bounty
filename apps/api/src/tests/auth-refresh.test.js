import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/refresh rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { success: false, message: "Unauthorized" });
  });
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = signAccessToken({ sub: "usr_refresh_test", role: "admin" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    const refreshed = verifyAccessToken(payload.data.token);
    assert.equal(refreshed.sub, "usr_refresh_test");
    assert.equal(refreshed.role, "admin");
  });
});
