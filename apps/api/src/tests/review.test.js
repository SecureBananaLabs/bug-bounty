import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server;
let baseUrl;

const validReviewPayload = {
  jobId: "job-123",
  targetUserId: "user-456",
  rating: 5,
  comment: "Great experience working together!"
};

beforeEach(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Test 1: Valid review creation returns 201 with created object", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validReviewPayload)
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.jobId, validReviewPayload.jobId);
  assert.equal(body.data.targetUserId, validReviewPayload.targetUserId);
  assert.equal(body.data.rating, validReviewPayload.rating);
  assert.equal(body.data.comment, validReviewPayload.comment);
  assert.ok(body.data.id);
});

test("Test 2: Missing jobId returns HTTP 400", async () => {
  const { jobId, ...payload } = validReviewPayload;
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.error);
  assert.ok(Array.isArray(body.issues));
  assert.ok(body.issues.some((issue) => issue.path.includes("jobId")));
});

test("Test 3: Missing targetUserId returns HTTP 400", async () => {
  const { targetUserId, ...payload } = validReviewPayload;
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.error);
  assert.ok(Array.isArray(body.issues));
  assert.ok(body.issues.some((issue) => issue.path.includes("targetUserId")));
});

test("Test 4: Rating below 1 (0 or negative) returns HTTP 400", async () => {
  for (const rating of [0, -1, -5]) {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validReviewPayload, rating })
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.issues.some((issue) => issue.path.includes("rating")));
  }
});

test("Test 5: Rating above 5 (6 or higher) returns HTTP 400", async () => {
  for (const rating of [6, 10, 100]) {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validReviewPayload, rating })
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.issues.some((issue) => issue.path.includes("rating")));
  }
});

test("Test 6: Non-integer rating (e.g. 4.5) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...validReviewPayload, rating: 4.5 })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.issues.some((issue) => issue.path.includes("rating")));
});

test("Test 7: Non-numeric rating returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...validReviewPayload, rating: "five" })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.issues.some((issue) => issue.path.includes("rating")));
});

test("Test 8: Short comment (< 5 chars) returns HTTP 400", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...validReviewPayload, comment: "Hi!" })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.issues.some((issue) => issue.path.includes("comment")));
});

test("Test 9: Comment exceeding 2000 chars returns HTTP 400", async () => {
  const longComment = "a".repeat(2001);
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...validReviewPayload, comment: longComment })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.ok(body.issues.some((issue) => issue.path.includes("comment")));
});

test("Test 10: GET /api/reviews returns 200 with array of reviews", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});
