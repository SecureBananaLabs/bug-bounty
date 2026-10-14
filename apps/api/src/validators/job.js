import { z } from "zod";

const jobObjectSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobObjectSchema.refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  }
);

export const updateJobSchema = jobObjectSchema
  .partial()
  .refine(
    (data) => {
      // Only validate when both fields are present
      if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    {
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    }
  );
