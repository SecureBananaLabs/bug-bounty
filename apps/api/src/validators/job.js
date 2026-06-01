import { z } from "zod";

const jobBaseSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
});

const budgetRangeCheck = {
  refine: (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
};

export const createJobSchema = jobBaseSchema.refine(budgetRangeCheck.refine, {
  message: budgetRangeCheck.message,
  path: budgetRangeCheck.path,
});

export const updateJobSchema = jobBaseSchema.partial().refine(budgetRangeCheck.refine, {
  message: budgetRangeCheck.message,
  path: budgetRangeCheck.path,
});
