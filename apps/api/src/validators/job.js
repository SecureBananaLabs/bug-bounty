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
  { message: "budgetMin must not exceed budgetMax", path: ["budgetMin"] }
);

export const updateJobSchema = z.object({
  title: z.string().min(4).optional(),
  description: z.string().min(10).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  categoryId: z.string().min(1).optional(),
  skills: z.array(z.string().min(1)).default([]).optional()
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  { message: "budgetMin must not exceed budgetMax", path: ["budgetMin"] }
);
