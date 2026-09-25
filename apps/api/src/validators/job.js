import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).superRefine((value, ctx) => {
  if (value.budgetMax < value.budgetMin) {
    ctx.addIssue({
      path: ["budgetMax"],
      code: "custom",
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
});

export const updateJobSchema = createJobSchema.partial();
