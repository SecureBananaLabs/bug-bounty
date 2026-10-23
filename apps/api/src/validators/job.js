import { z } from "zod";

if (!z.ZodEffects.prototype.partial) {
  z.ZodEffects.prototype.partial = function () {
    return this._def.schema.partial();
  };
}

export const createJobSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(150, "Title cannot exceed 150 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description cannot exceed 5000 characters"),
  budgetMin: z.number().nonnegative("Budget min must be non-negative").max(10000000, "Budget min exceeds maximum limit"),
  budgetMax: z.number().nonnegative("Budget max must be non-negative").max(10000000, "Budget max exceeds maximum limit"),
  categoryId: z.string().trim().min(1, "Category ID is required").max(64, "Category ID too long"),
  skills: z.array(z.string().trim().min(1).max(50)).max(30, "Cannot specify more than 30 skills").default([])
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = createJobSchema.partial();
