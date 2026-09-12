import { z } from "zod";

const budgetRangeCheck = (data, ctx) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
};

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).superRefine(budgetRangeCheck);

export const updateJobSchema = z.object({
  title: z.string().min(4).optional(),
  description: z.string().min(10).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  categoryId: z.string().min(1).optional(),
  skills: z.array(z.string().min(1)).optional()
}).superRefine(budgetRangeCheck);
