import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function fetchLocal(app, path, options = {}) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${path}`;
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const body = await response.json();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return { response, body };
}

test("POST /api/reviews with valid payload creates review", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 4,
      comment: "Great work!",
    }),
  });
  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.reviewerId, "user_1");
  assert.equal(body.data.rating, 4);
});

test("POST /api/reviews with valid payload without comment creates review", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 5,
    }),
  });
  assert.equal(response.status, 201);
  assert.equal(body.success, true);
});

test("POST /api/reviews rejects missing reviewerId", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      revieweeId: "user_2",
      rating: 3,
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/reviews rejects missing revieweeId", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      rating: 3,
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/reviews rejects rating below 1", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 0,
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/reviews rejects rating above 5", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 6,
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/reviews rejects non-integer rating", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 3.5,
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/reviews rejects empty comment", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 3,
      comment: "   ",
    }),
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("GET /api/reviews returns empty list initially", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/reviews");
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert(Array.isArray(body.data));
});
