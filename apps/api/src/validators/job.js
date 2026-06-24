import { z } from "zod";

const baseJobFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
});

export const createJobSchema = baseJobFields.refine((data) => data.budgetMax >= data.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const updateJobSchema = baseJobFields
  .partial()
  .refine((data) => {
    if ("budgetMin" in data && "budgetMax" in data) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  }, {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"],
  });
