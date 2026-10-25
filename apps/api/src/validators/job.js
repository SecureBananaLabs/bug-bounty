import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine(data => data.budgetMin <= data.budgetMax, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).partial().refine(data => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});
