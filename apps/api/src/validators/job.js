import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  // .finite() rejects Infinity and NaN which .nonnegative() alone allows.
  budgetMin: z.number().nonnegative().finite(),
  budgetMax: z.number().nonnegative().finite(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).superRefine((data, ctx) => {
  // Reject inverted budget ranges (e.g. min:1200, max:500).
  if (data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
});

export const updateJobSchema = createJobSchema.partial();

