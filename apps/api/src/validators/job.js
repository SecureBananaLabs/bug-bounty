import { z } from "zod";

const jobFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobFields.refine(data => data.budgetMin <= data.budgetMax, {
  message: "budgetMin must not exceed budgetMax",
  path: ["budgetMax"]
});

export const updateJobSchema = jobFields.partial();
