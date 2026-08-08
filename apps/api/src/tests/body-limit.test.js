import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("oversized JSON bodies return 413 instead of a server error", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Oversized request body",
        description: "x".repeat(120_000),
        budgetMin: 10,
        budgetMax: 20,
        categoryId: "cat_1",
        skills: []
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Request body too large"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
