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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/admin/metrics rejects non-admin tokens", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Forbidden"
    });
  });
});

test("GET /api/admin/metrics allows admin tokens", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data, "object");
    assert.notEqual(payload.data, null);
  });
});
