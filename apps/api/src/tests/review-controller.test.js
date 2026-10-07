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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validPayload = {
  rating: 5,
  comment: "Great collaboration",
  reviewerId: "usr_1",
  revieweeId: "usr_2"
};

test("POST /api/reviews accepts valid review payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great collaboration");
    assert.equal(payload.data.reviewerId, "usr_1");
    assert.equal(payload.data.revieweeId, "usr_2");
    assert.equal(typeof payload.data.id, "string");
  });
});

test("POST /api/reviews rejects ratings outside 1-5", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, rating: 6 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});

test("POST /api/reviews rejects unexpected properties", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, adminOverride: true })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid review payload"
    });
  });
});
