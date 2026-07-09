import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine(
  (data) => data.budgetMin <= data.budgetMax,
  {
    message: "budgetMin must be less than or equal to budgetMax",
    path: ["budgetMin"]
  }
);

export const updateJobSchema = createJobSchema.partial();
