import { z } from "zod";

const jobBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobBase.refine(
  (data) => data.budgetMin <= data.budgetMax,
  { message: "budgetMin must not exceed budgetMax", path: ["budgetMin"] }
);

export const updateJobSchema = jobBase.partial();
