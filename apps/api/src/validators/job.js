import { z } from "zod";

function budgetRangeIsOrdered(data, ctx) {
  if (
    typeof data.budgetMin === "number" &&
    typeof data.budgetMax === "number" &&
    data.budgetMax < data.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
}

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.superRefine(budgetRangeIsOrdered);

export const updateJobSchema = jobSchema.partial().superRefine(budgetRangeIsOrdered);
