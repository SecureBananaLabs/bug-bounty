import { z } from "zod";

const jobFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const validateBudgetRange = (payload, ctx) => {
  if (
    payload.budgetMin !== undefined &&
    payload.budgetMax !== undefined &&
    payload.budgetMin > payload.budgetMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMin must be less than or equal to budgetMax",
      path: ["budgetMax"]
    });
  }
};

export const createJobSchema = jobFields.superRefine(validateBudgetRange);

export const updateJobSchema = jobFields.partial().superRefine(validateBudgetRange);
