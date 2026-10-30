import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetReviews, listReviews } from "../services/reviewService.js";

test("Review Validation & Backing Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetReviews();
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/reviews rejects missing or non-integer rating", async () => {
    const missingRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        comment: "Excellent delivery!"
      })
    });
    assert.equal(missingRes.status, 400);

    const floatRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        rating: 4.5,
        comment: "Excellent delivery!"
      })
    });
    assert.equal(floatRes.status, 400);
  });

  await t.test("POST /api/reviews rejects rating outside 1-5 range", async () => {
    const zeroRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        rating: 0,
        comment: "Poor quality."
      })
    });
    assert.equal(zeroRes.status, 400);

    const overRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        rating: 6,
        comment: "Super quality."
      })
    });
    assert.equal(overRes.status, 400);
  });

  await t.test("POST /api/reviews rejects missing comment or jobId", async () => {
    const noCommentRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        rating: 5
      })
    });
    assert.equal(noCommentRes.status, 400);

    const noJobRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        comment: "Great work!"
      })
    });
    assert.equal(noJobRes.status, 400);
  });

  await t.test("POST /api/reviews accepts valid review and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_456",
        rating: 5,
        comment: "Fast communication and clean code."
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.rating, 5);
    assert.equal(body.data.comment, "Fast communication and clean code.");
    assert.match(body.data.id, /^rev_/);
  });

  await t.test("listReviews returns a defensive snapshot array", async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_789",
        rating: 4,
        comment: "Solid work."
      })
    });
    assert.equal(res.status, 201);

    const snapshot = await listReviews();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listReviews();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
