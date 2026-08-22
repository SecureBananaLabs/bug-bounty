import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine((d) => d.budgetMax >= d.budgetMin, {
  message: "budgetMax must be >= budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = z.object({
  title: z.string().min(4).optional(),
  description: z.string().min(10).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  categoryId: z.string().min(1).optional(),
  skills: z.array(z.string().min(1)).optional()
}).refine((d) => {
  if (d.budgetMin !== undefined && d.budgetMax !== undefined) return d.budgetMax >= d.budgetMin;
  return true;
}, { message: "budgetMax must be >= budgetMin", path: ["budgetMax"] });
