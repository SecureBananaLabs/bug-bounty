import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const validateBudgetRange = (job, context) => {
  if (
    typeof job.budgetMin === "number" &&
    typeof job.budgetMax === "number" &&
    job.budgetMax < job.budgetMin
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
};

export const createJobSchema = jobFieldsSchema.superRefine(validateBudgetRange);

export const updateJobSchema = jobFieldsSchema.partial().superRefine(validateBudgetRange);
