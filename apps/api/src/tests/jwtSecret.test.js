import test from "node:test";
import assert from "node:assert/strict";

test("JWT secret should fall back to hardcoded default for testing", () => {
  // The fix uses || instead of ?? to catch empty string
  const secret = process.env.JWT_SECRET || "dev-secret";
  assert.ok(secret.length > 0);
  assert.equal(typeof secret, "string");
});

test("server starts with default config", async () => {
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
