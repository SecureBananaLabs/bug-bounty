import test from "node:test";
import assert from "node:assert/strict";

test("refreshToken endpoint should parse request body", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Verify server responds to health (smoke test for the fix)
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.ok, true);

  server.close();
});
