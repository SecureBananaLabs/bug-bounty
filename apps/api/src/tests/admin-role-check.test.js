import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

test("admin metrics rejects unauthenticated request", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.success, false);

  await new Promise((r) => server.close(r));
});

test("admin metrics rejects non-admin user", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_test", role: "client" });
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();

  assert.equal(res.status, 403);
  assert.equal(body.success, false);
  assert.match(body.message, /admin/i);

  await new Promise((r) => server.close(r));
});

test("admin metrics allows admin user", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.openJobs !== undefined);

  await new Promise((r) => server.close(r));
});
