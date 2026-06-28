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

test("POST /api/reviews with rating 999 returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "usr_1",
      revieweeId: "usr_2",
      comment: "Great work",
      rating: 999,
    }),
  });
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/reviews with valid payload returns 201", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "usr_1",
      revieweeId: "usr_2",
      comment: "Great work",
      rating: 5,
    }),
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.equal(body.success, true);

  await close(server);
});
