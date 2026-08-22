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

test("GET /api/admin/metrics rejects non-admin users", async () => {
  await withServer(async (port) => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "Forbidden");
  });
});

test("GET /api/admin/metrics allows admin users", async () => {
  await withServer(async (port) => {
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(typeof payload.data, "object");
  });
});
