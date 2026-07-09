import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("review creation rejects out of bounds rating 9 case 113", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_reviewer_113",
        revieweeId: "usr_reviewee_113",
        jobId: "job_113",
        rating: 9,
        comment: "Comment for case 113"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
