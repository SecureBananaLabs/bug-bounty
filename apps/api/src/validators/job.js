import { z } from "zod";

const skillNameSchema = z.string().trim().min(1).max(64);

const baseJobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(skillNameSchema).max(50).default([])
};

export const createJobSchema = z
  .object(baseJobFields)
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  });

export const updateJobSchema = z
  .object(baseJobFields)
  .partial()
  .refine(
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
