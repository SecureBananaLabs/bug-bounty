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
async function getToken(port) {
  const r = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `job${Date.now()}@test.com`, password: "password1", fullName: "Tester", role: "client" })
  });
  return (await r.json()).data?.token;
}

test("POST /api/jobs - rejects unauthenticated requests", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test", description: "A test job description here", budgetMin: 100, budgetMax: 500, categoryId: "c1" })
  });
  assert.equal(res.status, 401);
  await close(server);
});

test("POST /api/jobs - rejects inverted budget", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = await getToken(port);
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Test", description: "A test job description here", budgetMin: 500, budgetMax: 100, categoryId: "c1" })
  });
  assert.ok(res.status === 400 || res.status === 422, `expected 4xx got ${res.status}`);
  await close(server);
});

test("POST /api/jobs - server id cannot be injected", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = await getToken(port);
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: "injected", title: "Test job here ok", description: "A test job description here long enough", budgetMin: 100, budgetMax: 500, categoryId: "c1", status: "closed" })
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.notEqual(body.data.id, "injected");
  assert.equal(body.data.status, "open");
  await close(server);
});
