import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function postReview(base, body) {
  const response = await fetch(`${base}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { status: response.status, payload: await response.json() };
}

test("POST /api/reviews stores the job the review belongs to", async () => {
  await withServer(async (base) => {
    const { status, payload } = await postReview(base, {
      jobId: "job_42",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 5,
      comment: "Delivered ahead of schedule"
    });

    assert.equal(status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_42");
    assert.equal(payload.data.rating, 5);
  });
});

test("POST /api/reviews rejects a review without a job association", async () => {
  await withServer(async (base) => {
    const { status, payload } = await postReview(base, {
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 4,
      comment: "Solid communication throughout the job"
    });

    assert.equal(status, 400);
    assert.equal(payload.success, false);

    const list = await fetch(`${base}/api/reviews`);
    const listed = await list.json();

    assert.equal(
      listed.data.some((review) => review.rating === 4),
      false
    );
  });
});

test("Review schema links a review to its job", () => {
  const schema = readFileSync(
    fileURLToPath(new URL("../../../../packages/db/prisma/schema.prisma", import.meta.url)),
    "utf8"
  );
  const reviewBlock = schema.slice(schema.indexOf("model Review {"));

  assert.match(reviewBlock, /jobId\s+String/);
  assert.match(reviewBlock, /job\s+Job\s+@relation\(fields: \[jobId\], references: \[id\]\)/);
  assert.match(schema.slice(schema.indexOf("model Job {")), /reviews\s+Review\[\]/);
});
