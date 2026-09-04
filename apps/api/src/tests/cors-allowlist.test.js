import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("CORS blocks unlisted origins when ALLOWED_ORIGINS is not set", async () => {
  delete process.env.ALLOWED_ORIGINS;
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { "Origin": "https://evil.example.com" }
  });
  // When cors origin: false, no Access-Control-Allow-Origin header is set
  assert.ok(!res.headers.get("access-control-allow-origin"), "CORS header must not be set for unlisted origin");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
