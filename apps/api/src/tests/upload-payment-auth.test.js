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

test("upload route rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST"
  });
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("payment route rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd" })
  });
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("upload route allows authenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_test", role: "client" });
  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);

  await new Promise((r) => server.close(r));
});

test("payment route allows authenticated requests", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_test", role: "client" });
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount: 100, currency: "usd" })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);

  await new Promise((r) => server.close(r));
});
