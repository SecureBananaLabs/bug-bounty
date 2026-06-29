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
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics requires admin role", async () => {
  await withServer(async (baseUrl) => {
    const anonymousResponse = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(anonymousResponse.status, 401);
    assert.deepEqual(await anonymousResponse.json(), {
      success: false,
      message: "Unauthorized",
    });

    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` },
    });
    assert.equal(clientResponse.status, 403);
    assert.deepEqual(await clientResponse.json(), {
      success: false,
      message: "Forbidden",
    });

    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const adminPayload = await adminResponse.json();

    assert.equal(adminResponse.status, 200);
    assert.equal(adminPayload.success, true);
  });
});
