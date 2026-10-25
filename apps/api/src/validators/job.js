import { z } from "zod";

// Custom refinement to reject inverted budget ranges
const rejectInvertedBudget = (schema) =>
  schema.refine(
    (data) => data.budgetMax === undefined || data.budgetMin === undefined || data.budgetMax >= data.budgetMin,
    {
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"],
    }
  );

export const createJobSchema = rejectInvertedBudget(
  z.object({
    title: z.string().min(4),
    description: z.string().min(10),
    budgetMin: z.number().nonnegative(),
    budgetMax: z.number().nonnegative(),
    categoryId: z.string().min(1),
    skills: z.array(z.string().min(1)).default([])
  })
);

export const updateJobSchema = rejectInvertedBudget(
  z.object({
    title: z.string().min(4).optional(),
    description: z.string().min(10).optional(),
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().nonnegative().optional(),
    categoryId: z.string().min(1).optional(),
    skills: z.array(z.string().min(1)).default([]).optional()
  })
).refine(
  (data) => {
    // Only validate when both fields are present
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"],
  }
);
