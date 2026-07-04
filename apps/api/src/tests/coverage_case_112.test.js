import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("review creation rejects out of bounds rating 8 case 112", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_reviewer_112",
        revieweeId: "usr_reviewee_112",
        jobId: "job_112",
        rating: 8,
        comment: "Comment for case 112"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
