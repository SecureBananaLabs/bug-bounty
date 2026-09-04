import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, body) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/reviews rejects invalid review payloads", async () => {
  await withServer(async (baseUrl) => {
    const missingRequired = await postReview(baseUrl, {
      reviewerId: "usr_reviewer",
      rating: 5
    });
    const invalidRating = await postReview(baseUrl, {
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 6
    });
    const emptyComment = await postReview(baseUrl, {
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 4,
      comment: ""
    });

    assert.equal(missingRequired.status, 400);
    assert.equal(invalidRating.status, 400);
    assert.equal(emptyComment.status, 400);

    assert.equal((await missingRequired.json()).success, false);
    assert.equal((await invalidRating.json()).success, false);
    assert.equal((await emptyComment.json()).success, false);
  });
});

test("POST /api/reviews creates valid reviews", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 5,
      comment: "Excellent work"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_/);
    assert.equal(payload.data.reviewerId, "usr_reviewer");
    assert.equal(payload.data.revieweeId, "usr_reviewee");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Excellent work");
  });
});
