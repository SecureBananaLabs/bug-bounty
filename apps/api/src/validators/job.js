import { z } from "zod";

function hasValidBudgetRange(data) {
  if (typeof data.budgetMin !== "number" || typeof data.budgetMax !== "number") {
    return true;
  }

  return data.budgetMax >= data.budgetMin;
}

function withBudgetRangeValidation(schema) {
  return schema.refine(hasValidBudgetRange, {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  });
}

const jobSchemaFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

export const createJobSchema = withBudgetRangeValidation(z.object(jobSchemaFields));

export const updateJobSchema = withBudgetRangeValidation(z.object(jobSchemaFields).partial());
