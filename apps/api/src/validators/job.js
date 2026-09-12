import { z } from "zod";

function addBudgetRangeValidation(schema) {
  return schema.superRefine((payload, ctx) => {
    if (
      payload.budgetMin !== undefined &&
      payload.budgetMax !== undefined &&
      payload.budgetMax < payload.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "budgetMax must be greater than or equal to budgetMin",
        path: ["budgetMax"]
      });
    }
  });
}

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = addBudgetRangeValidation(jobFieldsSchema);

export const updateJobSchema = addBudgetRangeValidation(jobFieldsSchema.partial());
