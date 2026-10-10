import assert from "node:assert/strict";
import test from "node:test";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = { title: "Valid job", description: "A complete job description", budgetMin: 10, budgetMax: 20, categoryId: "cat-1" };

test("accepts valid skills and trims surrounding whitespace", () => {
  const result = createJobSchema.parse({ ...validJob, skills: [" TypeScript ", "Rust"] });
  assert.deepEqual(result.skills, ["TypeScript", "Rust"]);
});

test("rejects whitespace-only skills in create and update", () => {
  for (const schema of [createJobSchema, updateJobSchema]) {
    const payload = schema === createJobSchema ? validJob : {};
    assert.equal(schema.safeParse({ ...payload, skills: ["  ", "Go"] }).success, false);
  }
});

test("accepts 50 skills at the 64-character boundary", () => {
  const skills = Array.from({ length: 50 }, (_, index) => `${index}`.padStart(64, "x"));
  assert.equal(createJobSchema.safeParse({ ...validJob, skills }).success, true);
});

test("rejects more than 50 skills", () => {
  assert.equal(createJobSchema.safeParse({ ...validJob, skills: Array(51).fill("Go") }).success, false);
});

test("rejects skills longer than 64 characters", () => {
  assert.equal(createJobSchema.safeParse({ ...validJob, skills: ["x".repeat(65)] }).success, false);
});

test("preserves omitted skills defaults and partial update behavior", () => {
  assert.deepEqual(createJobSchema.parse(validJob).skills, []);
  assert.deepEqual(updateJobSchema.parse({ title: "Updated" }), { title: "Updated" });
});

test("500+ deterministic synthetic skill-list boundary cases", () => {
  let cases = 0;
  for (let count = 0; count <= 60; count++) {
    for (let length = 0; length <= 70; length += 5) {
      const skills = Array(count).fill("k".repeat(length));
      const expected = count <= 50 && (count === 0 || (length >= 1 && length <= 64));
      for (const schema of [createJobSchema, updateJobSchema]) {
        const payload = schema === createJobSchema ? { ...validJob, skills } : { skills };
        const actual = schema.safeParse(payload).success;
        assert.equal(actual, expected, `count=${count}; length=${length}; mode=${schema === createJobSchema ? "create" : "update"}`);
        cases++;
      }
    }
  }
  assert.equal(cases, 1830);
});
