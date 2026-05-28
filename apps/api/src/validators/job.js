import { z } from "zod";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

export const createJobSchema = z.object(jobFields).refine(
  (data) => data.budgetMin <= data.budgetMax,
  {
    message: "budgetMin must be less than or equal to budgetMax",
    path: ["budgetMin"]
  }
);

export const updateJobSchema = z.object(jobFields).partial();
