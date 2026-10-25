import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { adminRoutes } from "../routes/adminRoutes.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = express();
  app.use("/api/admin", adminRoutes);
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

test("admin metrics requires authentication", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
    assert.equal(response.status, 401);
  });
});

test("admin metrics rejects authenticated non-admin users", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Forbidden" });
  });
});

test("admin metrics allows admin users", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
  });
});
