import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema accepts valid budget ranges", () => {
  const validJob = {
    title: "Senior Full Stack Engineer",
    description: "Design and implement scalable APIs and web apps.",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "engineering",
    skills: ["Node.js", "Express"]
  };

  const parsed = createJobSchema.safeParse(validJob);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.budgetMin, 500);
  assert.equal(parsed.data.budgetMax, 1000);

  // Equal min and max budget (fixed price)
  const fixedPriceJob = {
    ...validJob,
    budgetMin: 500,
    budgetMax: 500
  };
  const fixedParsed = createJobSchema.safeParse(fixedPriceJob);
  assert.equal(fixedParsed.success, true);
});

test("createJobSchema rejects inverted budget range (budgetMax < budgetMin)", () => {
  const invertedJob = {
    title: "Senior Full Stack Engineer",
    description: "Design and implement scalable APIs and web apps.",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "engineering",
    skills: ["Node.js", "Express"]
  };

  const parsed = createJobSchema.safeParse(invertedJob);
  assert.equal(parsed.success, false);
  
  const issue = parsed.error.issues.find((i) => i.path.includes("budgetMax"));
  assert.ok(issue, "Expected a validation issue on budgetMax");
  assert.match(issue.message, /budgetMax must be greater than or equal to budgetMin/);
});

test("updateJobSchema rejects inverted budget range when both budget fields are present", () => {
  const invertedUpdate = {
    budgetMin: 600,
    budgetMax: 300
  };

  const parsed = updateJobSchema.safeParse(invertedUpdate);
  assert.equal(parsed.success, false);

  const issue = parsed.error.issues.find((i) => i.path.includes("budgetMax"));
  assert.ok(issue, "Expected a validation issue on budgetMax");
  assert.match(issue.message, /budgetMax must be greater than or equal to budgetMin/);
});

test("updateJobSchema accepts valid updates and single budget updates", () => {
  // Both fields present and valid
  const validUpdate = {
    budgetMin: 300,
    budgetMax: 600
  };
  assert.equal(updateJobSchema.safeParse(validUpdate).success, true);

  // Equal values
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 500 }).success, true);

  // Only budgetMin provided
  assert.equal(updateJobSchema.safeParse({ budgetMin: 400 }).success, true);

  // Only budgetMax provided
  assert.equal(updateJobSchema.safeParse({ budgetMax: 800 }).success, true);

  // Neither budget field provided
  assert.equal(updateJobSchema.safeParse({ title: "Updated Title" }).success, true);
  assert.equal(updateJobSchema.safeParse({}).success, true);
});
