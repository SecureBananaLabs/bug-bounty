import { describe, it, expect } from "vitest";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

describe("job validators", () => {
  describe("createJobSchema", () => {
    it("accepts valid budget range", () => {
      const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "cat-1",
        skills: ["javascript"]
      });
      expect(result.success).toBe(true);
    });

    it("rejects inverted budget range", () => {
      const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 500,
        budgetMax: 100,
        categoryId: "cat-1",
        skills: []
      });
      expect(result.success).toBe(false);
    });

    it("allows equal min and max", () => {
      const result = createJobSchema.safeParse({
        title: "Test Job",
        description: "This is a test job description",
        budgetMin: 200,
        budgetMax: 200,
        categoryId: "cat-1",
        skills: []
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateJobSchema", () => {
    it("accepts partial update with only budgetMin", () => {
      const result = updateJobSchema.safeParse({ budgetMin: 100 });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with only budgetMax", () => {
      const result = updateJobSchema.safeParse({ budgetMax: 500 });
      expect(result.success).toBe(true);
    });

    it("rejects inverted range when both fields present", () => {
      const result = updateJobSchema.safeParse({
        budgetMin: 500,
        budgetMax: 100
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid range when both fields present", () => {
      const result = updateJobSchema.safeParse({
        budgetMin: 100,
        budgetMax: 500
      });
      expect(result.success).toBe(true);
    });
  });
});
