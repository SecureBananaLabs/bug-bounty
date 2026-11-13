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

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth middleware accepts bearer tokens with flexible spacing", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_test", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer    ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("auth middleware still rejects non-bearer and invalid tokens", async () => {
  await withServer(async (port) => {
    const nonBearer = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        Authorization: "Token abc123"
      }
    });
    const nonBearerPayload = await nonBearer.json();

    assert.equal(nonBearer.status, 401);
    assert.equal(nonBearerPayload.message, "Unauthorized");

    const invalidBearer = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        Authorization: "Bearer invalid-token"
      }
    });
    const invalidPayload = await invalidBearer.json();

    assert.equal(invalidBearer.status, 401);
    assert.equal(invalidPayload.message, "Invalid token");
  });
});
