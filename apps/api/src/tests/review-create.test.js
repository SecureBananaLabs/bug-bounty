import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews ignores caller-supplied id", async () => {
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "attacker-controlled-id",
        rating: 5,
        comment: "great work",
      }),
    });
    const payload = await response.json();
    const review = payload.data;

    assert.equal(response.status, 201);
    assert.equal(review.id === "attacker-controlled-id", false);
    assert.match(review.id, /^rev_\d+$/);
    assert.equal(review.rating, 5);
    assert.equal(review.comment, "great work");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
