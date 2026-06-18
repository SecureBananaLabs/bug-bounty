import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs with inverted budget ranges (budgetMin > budgetMax) returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "Valid Job Title Here",
      description: "This is a valid description that meets the length requirements.",
      budgetMin: 500,
      budgetMax: 200, // Inverted budget ranges
      categoryId: "cat_123"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");
  assert.ok(Array.isArray(payload.errors));
  
  const budgetError = payload.errors.find(e => e.path.includes("budgetMin"));
  assert.ok(budgetError);
  assert.equal(budgetError.message, "budgetMin must be less than or equal to budgetMax");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
