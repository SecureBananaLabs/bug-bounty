import { z } from "zod";

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema.refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "budgetMax cannot be lower than budgetMin",
    path: ["budgetMax"]
  }
);

export const updateJobSchema = baseJobSchema.partial().refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: "budgetMax cannot be lower than budgetMin",
    path: ["budgetMax"]
  }
);
