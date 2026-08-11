import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs budget range validation", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // 1. Creating a job with valid budget (budgetMin <= budgetMax) should succeed (201 Created)
  const validPayload = {
    title: "Senior React Developer Needed",
    description: "Looking for an expert React developer with 5+ years of experience in state management.",
    budgetMin: 50,
    budgetMax: 100,
    categoryId: "tech-development",
    skills: ["React", "TypeScript", "Redux"]
  };

  const responseValid = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonStringify(validPayload)
  });

  const payloadValid = await responseValid.json();
  assert.equal(responseValid.status, 201);
  assert.equal(payloadValid.success, true);
  assert.equal(payloadValid.data.title, validPayload.title);
  assert.equal(payloadValid.data.budgetMin, validPayload.budgetMin);
  assert.equal(payloadValid.data.budgetMax, validPayload.budgetMax);

  // 2. Creating a job with inverted budget (budgetMin > budgetMax) should fail (400 Bad Request)
  const invalidPayload = {
    title: "Senior Node.js Developer",
    description: "Looking for a backend engineer experienced in building scalable Express.js monorepos.",
    budgetMin: 120, // Inverted! budgetMin is larger than budgetMax
    budgetMax: 80,
    categoryId: "tech-development",
    skills: ["Node.js", "Express", "Zod"]
  };

  const responseInvalid = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonStringify(invalidPayload)
  });

  const payloadInvalid = await responseInvalid.json();
  assert.equal(responseInvalid.status, 400);
  assert.equal(payloadInvalid.success, false);
  assert.equal(payloadInvalid.message, "Validation error");
  assert.ok(Array.isArray(payloadInvalid.errors));
  
  // Verify that the error is associated with the budgetMax path
  const pathError = payloadInvalid.errors.find(e => e.path.includes("budgetMax"));
  assert.ok(pathError);
  assert.equal(pathError.message, "budgetMin must be less than or equal to budgetMax");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function jsonStringify(obj) {
  return JSON.stringify(obj);
}
