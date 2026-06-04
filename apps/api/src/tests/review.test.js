import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews preserves the generated review id", async () => {
  const originalNow = Date.now;
  Date.now = () => 135790;
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "rev_attacker",
        jobId: "job_123",
        rating: 5,
        comment: "Great delivery"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.id, "rev_135790");
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.rating, 5);
  } finally {
    Date.now = originalNow;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
