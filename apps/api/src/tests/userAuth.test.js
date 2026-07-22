import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function call(path, opts) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((res, rej) => {
    server.once("listening", res);
    server.once("error", rej);
  });
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, opts);
  await new Promise((res, rej) => server.close((e) => (e ? rej(e) : res())));
  return response;
}

test("GET /api/users requires authentication", async () => {
  assert.equal((await call("/api/users")).status, 401);
});

test("POST /api/users requires authentication", async () => {
  const r = await call("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "x@y.test" }),
  });
  assert.equal(r.status, 401);
});
