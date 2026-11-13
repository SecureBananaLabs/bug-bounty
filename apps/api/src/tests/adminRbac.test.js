import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("admin metrics rejects requests without a token", () =>
  withServer(async (base) => {
    const response = await fetch(`${base}/api/admin/metrics`);
    assert.equal(response.status, 401);
  }));

test("admin metrics rejects non-admin roles", () =>
  withServer(async (base) => {
    for (const role of ["client", "freelancer"]) {
      const token = signAccessToken({ sub: "usr_test", role });
      const response = await fetch(`${base}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(response.status, 403);
      const payload = await response.json();
      assert.deepEqual(payload, { success: false, message: "Forbidden" });
    }
  }));

test("admin metrics allows the admin role", () =>
  withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${base}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
  }));
