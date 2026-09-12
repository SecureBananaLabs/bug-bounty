import { z } from "zod";

const budgetRangeCheck = (data) => {
  if (data.budgetMin != null && data.budgetMax != null && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
};

const budgetRangeMessage = (data) => ({
  message: `budgetMax (${data.budgetMax}) must be >= budgetMin (${data.budgetMin})`
});

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine(budgetRangeCheck, budgetRangeMessage);

export const updateJobSchema = createJobSchema.partial().refine(budgetRangeCheck, budgetRangeMessage);
