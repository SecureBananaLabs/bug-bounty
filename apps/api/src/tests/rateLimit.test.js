import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("rate limiter counts malformed JSON before body parsing", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const addr = server.address();
  const port = addr.port;
  // On WSL the server binds to :: by default
  const host = addr.family === "IPv6" ? `[::1]` : "127.0.0.1";
  const base = `http://${host}:${port}`;

  const opts = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid json!!}"
  };

  const r1 = await fetch(`${base}/api/auth/register`, opts);

  // The rate limiter runs before express.json(), so malformed JSON
  // is counted toward the quota. Check the ratelimit header shows
  // it was counted (remaining < 200).
  const ratelimit = r1.headers.get("ratelimit") ?? "";
  const remaining = parseInt(ratelimit.match(/remaining=(\d+)/)?.[1] ?? "200", 10);
  assert.ok(
    remaining < 200,
    `Expected remaining < 200, got ${remaining} — rate limiter not counting malformed JSON (header: "${ratelimit}")`
  );

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
