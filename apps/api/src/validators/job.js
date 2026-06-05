import { z } from "zod";

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema
  .refine((job) => job.budgetMin <= job.budgetMax, {
    message: "budgetMin must be less than or equal to budgetMax",
    path: ["budgetMin"]
  });

export const updateJobSchema = baseJobSchema.partial();
