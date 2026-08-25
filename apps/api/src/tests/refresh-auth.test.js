import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/auth/refresh returns 401 without bearer token", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
  });
  assert.equal(res.status, 401);

  const body = await res.json();
  assert.equal(body.success, false);

  await close(server);
});
