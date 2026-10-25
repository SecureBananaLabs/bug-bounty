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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/reviews rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/reviews rejects ratings outside 1 to 5", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      targetUserId: "usr_1",
      jobId: "job_1",
      rating: 999
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/reviews accepts valid reviews", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      targetUserId: "usr_1",
      jobId: "job_1",
      rating: 5,
      comment: "Great work"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.targetUserId, "usr_1");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
  });
});
