import { z } from "zod";

const jobShape = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const validateBudgetRange = (data, ctx) => {
  if (
    typeof data.budgetMin === "number" &&
    typeof data.budgetMax === "number" &&
    data.budgetMax < data.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    });
  }
};

export const createJobSchema = jobShape.superRefine(validateBudgetRange);

export const updateJobSchema = jobShape.partial().superRefine(validateBudgetRange);
