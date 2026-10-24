import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/refresh rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  await withServer(async (baseUrl) => {
    const incomingToken = signAccessToken({ sub: "usr_123", role: "freelancer" });

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${incomingToken}`
      }
    });
    const payload = await response.json();
    const refreshedToken = payload?.data?.token;
    const tokenPayload = verifyAccessToken(refreshedToken);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(tokenPayload.sub, "usr_123");
    assert.equal(tokenPayload.role, "freelancer");
  });
});
