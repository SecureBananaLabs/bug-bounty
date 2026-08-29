import { z } from "zod";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

function validateBudgetRange(data, ctx) {
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
}

export const createJobSchema = z.object(jobFields).superRefine(validateBudgetRange);

export const updateJobSchema = z.object(jobFields).partial().superRefine(validateBudgetRange);
