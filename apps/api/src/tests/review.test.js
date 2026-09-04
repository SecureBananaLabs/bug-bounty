import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const basePayload = { comment: "Great work", reviewerId: "usr_a", revieweeId: "usr_b" };

test("POST /api/reviews rejects rating below 1", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, { ...basePayload, rating: 0 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews rejects rating above 5", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, { ...basePayload, rating: 6 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews rejects negative rating", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, { ...basePayload, rating: -1 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews rejects non-integer rating", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, { ...basePayload, rating: 3.5 });
    assert.equal(response.status, 400);
  });
});

test("POST /api/reviews accepts valid rating", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, { ...basePayload, rating: 4 });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 4);
  });
});
