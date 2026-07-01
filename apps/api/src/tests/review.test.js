import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function fetchFromApp(app, path, options = {}) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects ratings outside the 1-5 range", async () => {
  const app = createApp();
  const response = await fetchFromApp(app, "/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rating: 6,
      comment: "Great work",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid review payload"
  });
});

test("POST /api/reviews accepts valid ratings", async () => {
  const app = createApp();
  const response = await fetchFromApp(app, "/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rating: 5,
      comment: "Great work",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.rating, 5);
  assert.equal(payload.data.comment, "Great work");
});
