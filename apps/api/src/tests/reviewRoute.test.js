import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validPayload = {
  reviewerId: "usr_1",
  revieweeId: "usr_2",
  rating: 4,
  comment: "good work"
};

test("POST /api/reviews creates a review with a valid payload", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload)
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 4);
    assert.equal(payload.data.reviewerId, "usr_1");
  });
});

test("POST /api/reviews allows an omitted comment", async () => {
  await withServer(async (port) => {
    const { comment, ...payload } = validPayload;
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.success, true);
  });
});

test("POST /api/reviews rejects an out-of-range rating with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, rating: 6 })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });
});

test("POST /api/reviews rejects a non-integer rating with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, rating: 3.5 })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });
});

test("POST /api/reviews rejects an empty comment with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, comment: "   " })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });
});

test("POST /api/reviews rejects a missing reviewerId with 400", async () => {
  await withServer(async (port) => {
    const { reviewerId, ...payload } = validPayload;
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });
});
