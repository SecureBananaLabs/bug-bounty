import { createJobSchema } from "./job.js";

describe("Job Budget Range Validation Reissue (#11637)", () => {
  it("should reject inverted budget ranges where budgetMin > budgetMax", () => {
    const res = createJobSchema.safeParse({
      title: "Senior Backend Developer",
      description: "Build robust Node.js microservices and REST API routes.",
      budgetMin: 2000,
      budgetMax: 1000,
      categoryId: "cat_backend",
      skills: ["nodejs"]
    });

    expect(res.success).toBe(false);
  });
});
