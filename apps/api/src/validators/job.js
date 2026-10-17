import { z } from "zod";

const budgetOrderMessage = "budgetMax must be greater than or equal to budgetMin";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function addBudgetOrderIssue(payload, ctx) {
  if (payload.budgetMax < payload.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: budgetOrderMessage
    });
  }
}

export const createJobSchema = jobSchema.superRefine(addBudgetOrderIssue);

export const updateJobSchema = jobSchema
  .partial()
  .superRefine((payload, ctx) => {
    if (
      typeof payload.budgetMin === "number" &&
      typeof payload.budgetMax === "number" &&
      payload.budgetMax < payload.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: budgetOrderMessage
      });
    }
  });
