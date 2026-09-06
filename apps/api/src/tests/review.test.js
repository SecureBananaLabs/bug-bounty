import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let port;

function startServer() {
  return new Promise((resolve, reject) => {
    const app = createApp();
    server = app.listen(0);
    server.once("listening", () => {
      port = server.address().port;
      resolve();
    });
    server.once("error", reject);
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test.before(startServer);
test.after(stopServer);

test("POST /api/reviews returns 400 when targetId is missing", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      rating: 3,
      comment: "good work"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews returns 400 for invalid rating below range", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 0,
      comment: "bad"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews returns 400 for invalid rating above range", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 6,
      comment: "too good"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews returns 400 for non-integer rating", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 3.5,
      comment: "decent"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews preserves server-owned id and ignores caller-supplied id", async () => {
  const callerId = "fake_hacked_id";
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: callerId,
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 4,
      comment: "great"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("rev_"));
  assert.notEqual(payload.data.id, callerId);
});

test("POST /api/reviews creates a valid review with all required fields", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 5,
      comment: "excellent"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("rev_"));
  assert.equal(payload.data.reviewerId, "user_1");
  assert.equal(payload.data.targetId, "user_2");
  assert.equal(payload.data.rating, 5);
  assert.equal(payload.data.comment, "excellent");
});

test("POST /api/reviews returns 400 when reviewerId is missing", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: "user_2",
      rating: 3,
      comment: "good work"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews returns 400 when comment is missing", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 3
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});

test("POST /api/reviews returns 400 when rating is missing", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewerId: "user_1",
      targetId: "user_2",
      comment: "good work"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
});
