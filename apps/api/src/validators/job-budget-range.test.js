import { createJobSchema } from "./job.js";

describe("Job Budget Range Inversion Validation (#11639)", () => {
  it("should reject inverted budget ranges where budgetMin > budgetMax", () => {
    const res = createJobSchema.safeParse({
      title: "Fullstack Developer Required",
      description: "Build robust API integration and frontend components.",
      budgetMin: 1000,
      budgetMax: 500,
      categoryId: "cat_dev",
      skills: ["javascript"]
    });

    expect(res.success).toBe(false);
  });

  it("should accept valid non-inverted budget ranges", () => {
    const res = createJobSchema.safeParse({
      title: "Fullstack Developer Required",
      description: "Build robust API integration and frontend components.",
      budgetMin: 500,
      budgetMax: 1000,
      categoryId: "cat_dev",
      skills: ["javascript"]
    });

    expect(res.success).toBe(true);
  });
});
