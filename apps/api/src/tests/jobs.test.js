import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((res, rej) => {
    server.once("listening", () => res(server));
    server.once("error", rej);
  });
}
function close(server) {
  return new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

test("POST /api/jobs - rejects unauthenticated requests", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test job", description: "A test description for a job", budgetMin: 100, budgetMax: 500, categoryId: "cat-1" })
  });
  assert.equal(res.status, 401);
  await close(server);
});

test("POST /api/jobs - rejects inverted budget (budgetMax < budgetMin)", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  // register to get a token
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "job@test.com", password: "password1", fullName: "Job Tester", role: "client" })
  });
  const { data } = await regRes.json();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
    body: JSON.stringify({ title: "Test job", description: "A test description for a job", budgetMin: 500, budgetMax: 100, categoryId: "cat-1" })
  });
  assert.ok(res.status === 400 || res.status === 422, `expected 4xx got ${res.status}`);
  await close(server);
});

test("POST /api/jobs - server-generated id cannot be overridden", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "job2@test.com", password: "password1", fullName: "Job Tester2", role: "client" })
  });
  const { data } = await regRes.json();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
    body: JSON.stringify({ id: "injected-id", title: "Test job", description: "A test description for job", budgetMin: 100, budgetMax: 500, categoryId: "cat-1", status: "closed" })
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.notEqual(body.data.id, "injected-id", "server must generate id");
  assert.equal(body.data.status, "open", "status must be server-controlled");
  await close(server);
});
