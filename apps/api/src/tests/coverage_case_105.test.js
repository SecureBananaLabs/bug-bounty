import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("review creation rejects out of bounds rating 11 case 105", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_reviewer_105",
        revieweeId: "usr_reviewee_105",
        jobId: "job_105",
        rating: 11,
        comment: "Comment for case 105"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
