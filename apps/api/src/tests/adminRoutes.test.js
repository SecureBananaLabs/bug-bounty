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

test("GET /api/admin/metrics requires an admin token", async () => {
  await withServer(async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/admin/metrics`);
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const adminPayload = await adminResponse.json();

    assert.equal(unauthenticated.status, 401);
    assert.equal(clientResponse.status, 403);
    assert.equal(adminResponse.status, 200);
    assert.equal(adminPayload.success, true);
    assert.equal(adminPayload.data.openJobs, 42);
  });
});
