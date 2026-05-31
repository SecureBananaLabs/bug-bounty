import { z } from "zod";

const _jobShape = {
  title: z.string().min(4, "Title must be at least 4 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  budgetMin: z.number().nonnegative("budgetMin must be >= 0"),
  budgetMax: z.number().nonnegative("budgetMax must be >= 0"),
  categoryId: z.string().min(1, "Category ID is required"),
  skills: z.array(z.string().min(1)).default([])
};

export const createJobSchema = z.object(_jobShape).refine(
  (data) => data.budgetMin <= data.budgetMax,
  {
    message: "budgetMin must be less than or equal to budgetMax",
    path: ["budgetMin"]
  }
);

// Fix #1467: updateSchema uses base shape directly (before .refine)
// so .partial() is still available for partial updates
export const updateJobSchema = z.object(_jobShape).partial();
