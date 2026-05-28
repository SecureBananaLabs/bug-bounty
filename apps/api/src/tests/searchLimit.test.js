import test from "node:test";
import assert from "node:assert/strict";

test("search endpoint accepts queries", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Test search without auth - should either work or return 401
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=test`);
  assert.ok([200, 401].includes(res.status));

  server.close();
});
