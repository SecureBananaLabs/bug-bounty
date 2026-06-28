import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// ─── createJobSchema tests ───────────────────────────────────────

test("createJobSchema accepts valid budget range", () => {
    const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat1",
        skills: ["javascript"]
    });
    assert.equal(result.success, true);
});

test("createJobSchema accepts equal min and max budget", () => {
    const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 300,
        budgetMax: 300,
        categoryId: "cat1",
        skills: []
    });
    assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range (min > max)", () => {
    const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 500,
        budgetMax: 100,
        categoryId: "cat1",
        skills: []
    });
    assert.equal(result.success, false);
    assert.ok(result.error?.flatten().fieldErrors.budgetMax);
});

// ─── updateJobSchema tests ───────────────────────────────────────

test("updateJobSchema rejects inverted budget when both fields present", () => {
    const result = updateJobSchema.safeParse({
        budgetMin: 500,
        budgetMax: 100,
    });
    assert.equal(result.success, false);
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
    const result = updateJobSchema.safeParse({
        budgetMin: 200,
    });
    assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
    const result = updateJobSchema.safeParse({
        budgetMax: 800,
    });
    assert.equal(result.success, true);
});