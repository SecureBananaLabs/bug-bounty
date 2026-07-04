import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("review payload validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /api/reviews with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_1",
        targetId: "usr_2",
        rating: 5,
        comment: "Great freelancer!"
      })
    });
    assert.equal(response.status, 201);
  });

  await t.test("POST /api/reviews with missing fields", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_1",
        rating: 5
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("POST /api/reviews with invalid rating range", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_1",
        targetId: "usr_2",
        rating: 6,
        comment: "Excellent"
      })
    });
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
