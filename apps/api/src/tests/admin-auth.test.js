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

test("admin metrics requires admin role", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });

    const unauthenticated = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(unauthenticated.status, 401);

    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });
    assert.equal(forbidden.status, 403);

    const allowed = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.equal(allowed.status, 200);
  });
});
