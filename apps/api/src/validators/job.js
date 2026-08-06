import { z } from "zod";

const jobShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

function requireOrderedBudgetRange(payload, ctx) {
  if (
    typeof payload.budgetMin === "number" &&
    typeof payload.budgetMax === "number" &&
    payload.budgetMax < payload.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    });
  }
}

export const createJobSchema = z.object(jobShape).superRefine(requireOrderedBudgetRange);

export const updateJobSchema = z.object(jobShape).partial().superRefine(requireOrderedBudgetRange);
