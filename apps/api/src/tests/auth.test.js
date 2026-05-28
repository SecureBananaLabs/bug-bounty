import test from "node:test";
import assert from "node:assert/strict";

test("protected routes return 401 without auth token", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Test authMiddleware is enforced on protected routes
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  assert.equal(res.status, 401);

  const payload = await res.json();
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  server.close();
});

test("unprotected routes don't need auth", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Health endpoint should be publicly accessible
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.ok, true);

  server.close();
});
