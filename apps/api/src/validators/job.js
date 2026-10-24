import { z } from "zod";

const baseJobSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  budgetMin: z.number().nonnegative("budgetMin must be non-negative"),
  budgetMax: z.number().nonnegative("budgetMax must be non-negative"),
  categoryId: z.string().min(1, "categoryId is required"),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema.refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
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
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  }
);
