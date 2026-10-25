import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// Helper function to create valid job data
function validJobData(overrides = {}) {
  return {
    title: "Test Job",
    description: "Test description for job validation",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat1",
    skills: ["javascript"],
    ...overrides,
  };
}

// ==========================================
// createJobSchema tests
// ==========================================

test("createJobSchema - accepts valid budget range", () => {
  const result = createJobSchema.safeParse(validJobData());
  assert.equal(result.success, true);
});

test("createJobSchema - accepts equal budget values", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 300,
    budgetMax: 300,
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - rejects inverted budget range", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 500,
    budgetMax: 100,
  }));
  assert.equal(result.success, false);
  assert.ok(result.error.issues[0].message.includes("budgetMax"));
});

test("createJobSchema - rejects budgetMax of 0 when budgetMin > 0", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 100,
    budgetMax: 0,
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - accepts both budgets at 0", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 0,
    budgetMax: 0,
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - accepts large budget values", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 10000,
    budgetMax: 50000,
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - accepts decimal budget values", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 99.99,
    budgetMax: 499.99,
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - accepts smallest positive difference", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 0,
    budgetMax: 0.01,
  }));
  assert.equal(result.success, true);
});

// Negative values
test("createJobSchema - rejects negative budgetMin", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: -100,
    budgetMax: 500,
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects negative budgetMax", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 100,
    budgetMax: -500,
  }));
  assert.equal(result.success, false);
});

// NaN and Infinity
test("createJobSchema - rejects NaN budgetMin", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: NaN,
    budgetMax: 500,
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects NaN budgetMax", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 100,
    budgetMax: NaN,
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects Infinity budgetMin", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: Infinity,
    budgetMax: 500,
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects Infinity budgetMax", () => {
  const result = createJobSchema.safeParse(validJobData({
    budgetMin: 100,
    budgetMax: Infinity,
  }));
  assert.equal(result.success, false);
});

// String validation
test("createJobSchema - rejects missing required fields", () => {
  const result = createJobSchema.safeParse({
    budgetMin: 100,
    budgetMax: 500,
  });
  assert.equal(result.success, false);
});

test("createJobSchema - rejects title too short", () => {
  const result = createJobSchema.safeParse(validJobData({
    title: "abc",
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects title too long", () => {
  const result = createJobSchema.safeParse(validJobData({
    title: "a".repeat(201),
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - accepts title at max length", () => {
  const result = createJobSchema.safeParse(validJobData({
    title: "a".repeat(200),
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - rejects description too short", () => {
  const result = createJobSchema.safeParse(validJobData({
    description: "short",
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects description too long", () => {
  const result = createJobSchema.safeParse(validJobData({
    description: "a".repeat(5001),
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - accepts description at max length", () => {
  const result = createJobSchema.safeParse(validJobData({
    description: "a".repeat(5000),
  }));
  assert.equal(result.success, true);
});

test("createJobSchema - rejects empty categoryId", () => {
  const result = createJobSchema.safeParse(validJobData({
    categoryId: "",
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects categoryId too long", () => {
  const result = createJobSchema.safeParse(validJobData({
    categoryId: "a".repeat(101),
  }));
  assert.equal(result.success, false);
});

// Skills validation
test("createJobSchema - uses default empty skills array", () => {
  const data = validJobData();
  delete data.skills;
  const result = createJobSchema.safeParse(data);
  assert.equal(result.success, true);
  assert.deepEqual(result.data.skills, []);
});

test("createJobSchema - rejects empty skill string", () => {
  const result = createJobSchema.safeParse(validJobData({
    skills: [""],
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects skill too long", () => {
  const result = createJobSchema.safeParse(validJobData({
    skills: ["a".repeat(51)],
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - rejects too many skills", () => {
  const result = createJobSchema.safeParse(validJobData({
    skills: Array(21).fill("skill"),
  }));
  assert.equal(result.success, false);
});

test("createJobSchema - accepts max skills count", () => {
  const result = createJobSchema.safeParse(validJobData({
    skills: Array(20).fill("skill"),
  }));
  assert.equal(result.success, true);
});

// ==========================================
// updateJobSchema tests
// ==========================================

test("updateJobSchema - accepts partial update with valid range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 100,
    budgetMax: 500,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema - rejects partial update with inverted range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues[0].message.includes("budgetMax"));
});

test("updateJobSchema - accepts update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema - accepts update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: 500,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema - accepts empty update", () => {
  const result = updateJobSchema.safeParse({});
  assert.equal(result.success, true);
});

test("updateJobSchema - accepts update with only title", () => {
  const result = updateJobSchema.safeParse({
    title: "Updated Job Title",
  });
  assert.equal(result.success, true);
});

test("updateJobSchema - rejects inverted range in partial update", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 100,
  });
  assert.equal(result.success, false);
});

test("updateJobSchema - rejects negative budgetMin in update", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: -100,
  });
  assert.equal(result.success, false);
});

test("updateJobSchema - rejects NaN in update", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: NaN,
  });
  assert.equal(result.success, false);
});

test("updateJobSchema - rejects Infinity in update", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: Infinity,
  });
  assert.equal(result.success, false);
});

test("updateJobSchema - rejects title too short in update", () => {
  const result = updateJobSchema.safeParse({
    title: "abc",
  });
  assert.equal(result.success, false);
});

test("updateJobSchema - rejects title too long in update", () => {
  const result = updateJobSchema.safeParse({
    title: "a".repeat(201),
  });
  assert.equal(result.success, false);
});

console.log("All job validation tests passed!");
