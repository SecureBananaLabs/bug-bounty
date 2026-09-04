import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((res, rej) => { server.once("listening", () => res(server)); server.once("error", rej); });
}
function close(server) {
  return new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

test("GET /api/admin/metrics - rejects unauthenticated", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  assert.equal(res.status, 401);
  await close(server);
});

test("GET /api/admin/metrics - rejects non-admin role", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "client@test.com", password: "password1", fullName: "Client User", role: "client" })
  });
  const { data } = await regRes.json();
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${data.token}` }
  });
  assert.equal(res.status, 403);
  await close(server);
});
