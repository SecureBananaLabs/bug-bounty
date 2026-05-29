import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

test("proposal routes reject unauthenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/proposals`);
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("proposal routes allow authenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_test", role: "client" });
  const res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));

  await new Promise((r) => server.close(r));
});
