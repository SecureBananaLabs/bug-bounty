import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace API",
  description: "Create a production-ready API for marketplace jobs.",
  budgetMin: 1000,
  budgetMax: 3000,
  categoryId: "backend",
  skills: [" Node.js ", "API", "Node.js", "Testing "]
};

test("createJobSchema trims and deduplicates skills", () => {
  const payload = createJobSchema.parse(validJob);

  assert.deepEqual(payload.skills, ["Node.js", "API", "Testing"]);
});

test("createJobSchema rejects blank, oversized, and excessive skills", () => {
  assert.throws(() => createJobSchema.parse({ ...validJob, skills: ["   "] }));
  assert.throws(() => createJobSchema.parse({ ...validJob, skills: ["a".repeat(41)] }));
  assert.throws(() => createJobSchema.parse({ ...validJob, skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`) }));
});

test("createJobSchema keeps skills optional with an empty default", () => {
  const payload = createJobSchema.parse({ ...validJob, skills: undefined });

  assert.deepEqual(payload.skills, []);
});

test("updateJobSchema normalizes skills when present", () => {
  const payload = updateJobSchema.parse({ skills: [" React ", "React", "CSS "] });

  assert.deepEqual(payload.skills, ["React", "CSS"]);
});
