import { z } from "zod";

const jobSchemaFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

const budgetRangeValidator = (payload) => {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }

  return payload.budgetMin <= payload.budgetMax;
};

const budgetRangeRefinement = {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ["budgetMax"]
};

export const createJobSchema = z
  .object(jobSchemaFields)
  .refine(budgetRangeValidator, budgetRangeRefinement);

export const updateJobSchema = z
  .object(jobSchemaFields)
  .partial()
  .refine(budgetRangeValidator, budgetRangeRefinement);
