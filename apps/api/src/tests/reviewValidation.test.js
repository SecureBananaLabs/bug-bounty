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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, rating) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rating,
      comment: "good work",
      reviewerId: "usr_a",
      revieweeId: "usr_b"
    })
  });
}

test("POST /api/reviews rejects ratings below 1", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, 0);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});

test("POST /api/reviews rejects ratings above 5", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, 999);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/reviews accepts ratings from 1 to 5", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, 5);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
  });
});
