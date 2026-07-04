import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("job creation succeeds with valid payload case 224", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Valid Job Title 224",
        description: "Job description must be long enough for case 224",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "category_224",
        skills: ["Node.js"],
        clientId: "usr_client_224"
      })
    });
    assert.equal(response.status, 201);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
