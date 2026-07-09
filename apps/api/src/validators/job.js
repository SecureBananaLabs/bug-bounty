import { z } from "zod";

const jobSchemaShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

const validateBudgetRange = (payload, ctx) => {
  if (
    typeof payload.budgetMin === "number" &&
    typeof payload.budgetMax === "number" &&
    payload.budgetMax < payload.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
};

export const createJobSchema = z.object(jobSchemaShape).superRefine(validateBudgetRange);

export const updateJobSchema = z.object(jobSchemaShape).partial().superRefine(validateBudgetRange);
