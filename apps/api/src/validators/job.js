import { z } from "zod";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

function hasValidBudgetRange(payload) {
  return payload.budgetMin === undefined ||
    payload.budgetMax === undefined ||
    payload.budgetMin <= payload.budgetMax;
}

export const createJobSchema = z.object(jobFields).refine(hasValidBudgetRange, {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ["budgetMax"]
});

export const updateJobSchema = z.object(jobFields).partial().refine(hasValidBudgetRange, {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ["budgetMax"]
});
