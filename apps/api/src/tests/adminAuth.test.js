import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
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

test("admin metrics requires an authenticated admin token", async () => {
  await withServer(async (baseUrl) => {
    const missingToken = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missingToken.status, 401);

    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const clientPayload = await clientResponse.json();

    assert.equal(clientResponse.status, 403);
    assert.deepEqual(clientPayload, {
      success: false,
      message: "Forbidden"
    });

    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminPayload = await adminResponse.json();

    assert.equal(adminResponse.status, 200);
    assert.equal(adminPayload.success, true);
    assert.equal(adminPayload.data.flaggedAccounts, 3);
  });
});
