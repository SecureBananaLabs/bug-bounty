import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validReview = {
  reviewerId: "usr_client",
  revieweeId: "usr_freelancer",
  rating: 5,
  comment: "Delivered clear milestones and high-quality work."
};

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
  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/reviews rejects empty review payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews rejects out-of-range ratings", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      ...validReview,
      rating: 6
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews rejects blank comments", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      ...validReview,
      comment: "   "
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews creates reviews from validated fields only", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      id: "rev_attacker",
      ...validReview,
      comment: `  ${validReview.comment}  `
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "rev_attacker");
    assert.equal(payload.data.reviewerId, validReview.reviewerId);
    assert.equal(payload.data.revieweeId, validReview.revieweeId);
    assert.equal(payload.data.rating, validReview.rating);
    assert.equal(payload.data.comment, validReview.comment);
  });
});
