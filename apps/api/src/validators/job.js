import { z } from "zod";

function budgetRangeRefinement(payload, context) {
  if (
    typeof payload.budgetMin === "number" &&
    typeof payload.budgetMax === "number" &&
    payload.budgetMax < payload.budgetMin
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    });
  }
}

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

export const createJobSchema = z.object(jobFields).superRefine(budgetRangeRefinement);

export const updateJobSchema = z.object(jobFields).partial().superRefine(budgetRangeRefinement);
