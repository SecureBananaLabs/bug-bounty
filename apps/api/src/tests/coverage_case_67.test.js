import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("job creation rejects negative budgetMax case 67", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Job 67",
        description: "Job description for case 67",
        budgetMin: 10,
        budgetMax: -77,
        skills: ["Node.js"],
        clientId: "usr_123"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
