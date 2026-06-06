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

test("POST /api/users ignores client-supplied id", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "password123", id: "usr_attacker" }),
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.match(body.data.id, /^usr_\d+$/);
  assert.notEqual(body.data.id, "usr_attacker");

  await close(server);
});

test("POST /api/proposals ignores client-supplied id", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "prp_attacker", jobId: "j1", freelancerId: "f1", bidAmount: 50, coverLetter: "test" }),
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.match(body.data.id, /^prp_\d+$/);
  assert.notEqual(body.data.id, "prp_attacker");

  await close(server);
});

test("POST /api/reviews ignores client-supplied id", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "rev_attacker", reviewerId: "r1", revieweeId: "e1", comment: "nice", rating: 4 }),
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.match(body.data.id, /^rev_\d+$/);
  assert.notEqual(body.data.id, "rev_attacker");

  await close(server);
});
