import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validPayload = {
  jobId: "job_123",
  reviewerId: "usr_456",
  rating: 5,
  comment: "Delivered exactly what was promised."
};

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

test("POST /api/reviews rejects invalid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_123", reviewerId: "" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews accepts valid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, validPayload.jobId);
    assert.equal(payload.data.reviewerId, validPayload.reviewerId);
    assert.equal(payload.data.rating, validPayload.rating);
    assert.equal(payload.data.comment, validPayload.comment);
  });
});
