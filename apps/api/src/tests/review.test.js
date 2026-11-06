import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const close = () =>
    new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  return { baseUrl, close };
}

test("GET /api/reviews returns 200 and list of reviews", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/reviews`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  } finally {
    await close();
  }
});

test("POST /api/reviews with valid payload returns 201 and created review", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const payload = {
      jobId: "job_12345",
      targetUserId: "user_67890",
      rating: 5,
      comment: "Excellent work, delivered on time!"
    };
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.jobId, payload.jobId);
    assert.equal(json.data.targetUserId, payload.targetUserId);
    assert.equal(json.data.rating, 5);
    assert.equal(json.data.comment, payload.comment);
    assert.ok(json.data.id);
  } finally {
    await close();
  }
});

test("POST /api/reviews with invalid rating (<1, >5, or float) returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const invalidRatings = [0, -1, 6, 10, 3.5];
    for (const rating of invalidRatings) {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "job_12345",
          targetUserId: "user_67890",
          rating,
          comment: "Great experience with developer"
        })
      });
      const json = await res.json();
      assert.equal(res.status, 400, `Expected 400 for rating ${rating}`);
      assert.equal(json.success, false);
      assert.equal(json.message, "Validation failed");
      assert.ok(Array.isArray(json.errors));
    }
  } finally {
    await close();
  }
});

test("POST /api/reviews with missing jobId or targetUserId returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const invalidPayloads = [
      { targetUserId: "user_123", rating: 4, comment: "Good job completed" },
      { jobId: "job_123", rating: 4, comment: "Good job completed" },
      { jobId: "", targetUserId: "user_123", rating: 4, comment: "Good job completed" },
      { jobId: "job_123", targetUserId: "", rating: 4, comment: "Good job completed" }
    ];
    for (const payload of invalidPayloads) {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      assert.equal(res.status, 400);
      assert.equal(json.success, false);
      assert.equal(json.message, "Validation failed");
      assert.ok(Array.isArray(json.errors));
    }
  } finally {
    await close();
  }
});

test("POST /api/reviews with short comment (<5) or long comment (>2000) returns 400", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const invalidComments = [
      "",
      "bad",
      "x".repeat(4),
      "x".repeat(2001)
    ];
    for (const comment of invalidComments) {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "job_12345",
          targetUserId: "user_67890",
          rating: 4,
          comment
        })
      });
      const json = await res.json();
      assert.equal(res.status, 400, `Expected 400 for comment length ${comment.length}`);
      assert.equal(json.success, false);
      assert.equal(json.message, "Validation failed");
      assert.ok(Array.isArray(json.errors));
    }
  } finally {
    await close();
  }
});
