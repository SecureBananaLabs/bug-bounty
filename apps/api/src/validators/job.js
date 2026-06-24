import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function withBudgetRangeValidation(schema) {
  return schema.superRefine((payload, context) => {
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
  });
}

export const createJobSchema = withBudgetRangeValidation(jobFieldsSchema);
export const updateJobSchema = withBudgetRangeValidation(jobFieldsSchema.partial());
