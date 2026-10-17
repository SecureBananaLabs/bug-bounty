import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

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

async function postRefresh(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/auth/refresh rejects anonymous callers", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postRefresh(baseUrl);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/auth/refresh preserves authenticated subject and role", async () => {
  await withServer(async (baseUrl) => {
    const originalToken = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
    const { response, payload } = await postRefresh(baseUrl, originalToken);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_refresh");
    assert.equal(decoded.role, "freelancer");
  });
});
