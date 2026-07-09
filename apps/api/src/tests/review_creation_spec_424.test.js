import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("review creation succeeds with valid parameters 424", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_reviewer_424",
        revieweeId: "usr_reviewee_424",
        jobId: "job_424",
        rating: 5,
        comment: "Great feedback for case 424"
      })
    });
    assert.equal(response.status, 201);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
