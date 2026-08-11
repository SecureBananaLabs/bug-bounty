import { z } from "zod";

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema.refine((payload) => payload.budgetMax >= payload.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = baseJobSchema.partial().refine((payload) => {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }

  return payload.budgetMax >= payload.budgetMin;
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});
