import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { listReviews } from "../services/reviewService.js";

test("POST /api/reviews rejects invalid ratings with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const testCases = [
      {}, // missing rating
      { rating: 0 }, // below min
      { rating: 6 }, // above max
      { rating: 3.5 }, // non-integer
      { rating: "five" } // wrong type
    ];

    for (const body of testCases) {
      const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Validation failed");
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/reviews creates review with integer rating 1-5 and preserves comments", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Top tier security auditor!", jobId: "job_123" })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Top tier security auditor!");
    assert.equal(payload.data.jobId, "job_123");
    assert.ok(payload.data.id.startsWith("rev_"));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listReviews returns an independent defensive array copy", async () => {
  const snapshot1 = await listReviews();
  const initialLength = snapshot1.length;

  // Attempt to mutate the returned snapshot
  snapshot1.push({ id: "malicious_injected_review", rating: 1 });
  snapshot1.length = 0;

  // Retrieve a fresh list
  const snapshot2 = await listReviews();
  assert.equal(snapshot2.length, initialLength);
  assert.equal(snapshot2.some((r) => r.id === "malicious_injected_review"), false);
});
