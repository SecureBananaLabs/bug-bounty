import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        reviewerId: "user_reviewer",
        revieweeId: "user_reviewee",
        rating: 5,
        comment: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});

test("POST /api/reviews accepts valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        reviewerId: "user_reviewer",
        revieweeId: "user_reviewee",
        rating: 5,
        comment: "Fast delivery and clear communication."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.reviewerId, "user_reviewer");
    assert.equal(payload.data.revieweeId, "user_reviewee");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Fast delivery and clear communication.");
    assert.match(payload.data.id, /^rev_/);
  });
});
