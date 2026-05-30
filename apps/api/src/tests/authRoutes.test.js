import test from "node:test";
import assert from "node:assert/strict";

test("protected routes require authentication", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Attempt to access protected route without auth
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  assert.equal(res.status, 401);
  const payload = await res.json();
  assert.equal(payload.success, false);

  server.close();
});
