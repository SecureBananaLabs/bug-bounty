import { z } from "zod";

const hasValidBudgetRange = (data) => {
  if (data.budgetMin === undefined || data.budgetMax === undefined) {
    return true;
  }

  return data.budgetMax >= data.budgetMin;
};

const budgetRangeMessage = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobFieldsSchema.refine(
  hasValidBudgetRange,
  budgetRangeMessage
);

export const updateJobSchema = jobFieldsSchema.partial().refine(
  hasValidBudgetRange,
  budgetRangeMessage
);
