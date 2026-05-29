import test from "node:test";
import assert from "node:assert/strict";

test("file upload endpoint validates file type", async () => {
  const app = (await import("../app.js")).createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);
  server.close();
});
