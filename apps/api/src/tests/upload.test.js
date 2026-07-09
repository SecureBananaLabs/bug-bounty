import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const addr = server.address();
  const port = addr.port;
  const host = addr.family === "IPv6" ? `[::1]` : "127.0.0.1";
  const base = `http://${host}:${port}`;

  // Request without auth header
  const r = await fetch(`${base}/api/uploads`, { method: "POST" });
  assert.equal(r.status, 401, "Expected 401 for unauthenticated upload request");

  const body = await r.json();
  assert.equal(body.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
