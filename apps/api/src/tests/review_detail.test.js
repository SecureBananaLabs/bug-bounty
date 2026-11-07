import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetReviews, listReviews } from "../services/reviewService.js";

test("Review Detail By ID & Array Encapsulation", async (t) => {
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

  await t.test("GET /api/reviews/:id returns 404 when review does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/reviews/non_existent_rev`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Review not found");
  });

  await t.test("POST /api/reviews creates a review and GET /api/reviews/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_12345",
        rating: 5,
        comment: "Exceptional code quality and timely delivery."
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const reviewId = createBody.data.id;
    assert.ok(reviewId);
    assert.match(reviewId, /^rev_/);

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/reviews/${reviewId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, reviewId);
    assert.equal(getBody.data.jobId, "job_12345");
    assert.equal(getBody.data.rating, 5);
    assert.equal(getBody.data.comment, "Exceptional code quality and timely delivery.");
  });

  await t.test("listReviews returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_555",
        rating: 4,
        comment: "Great communication throughout the sprint."
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listReviews();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listReviews();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
