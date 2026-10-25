import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const server = createApp().listen(0);
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

test("admin metrics require an admin role", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });

    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });
    assert.equal(clientResponse.status, 403);

    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminResponse.status, 200);
  });
});
