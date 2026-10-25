import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validPayload = {
  title: "Backend platform",
  description: "Need an engineer to harden our hiring workflow.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "engineering",
  skills: [" node ", "testing", "node", "testing "]
};

test("createJobSchema trims and deduplicates skills", () => {
  const payload = createJobSchema.parse(validPayload);

  assert.deepEqual(payload.skills, ["node", "testing"]);
});

test("createJobSchema rejects blank skills after trimming", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    skills: ["   "]
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "skills.0");
});

test("createJobSchema rejects oversized skill names", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    skills: ["a".repeat(33)]
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "skills.0");
});

test("createJobSchema rejects oversized skill arrays", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`)
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "skills");
});
