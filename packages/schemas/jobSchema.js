import { z } from 'zod';

const budgetRangeSchema = z.object({
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const createJobSchema = z.object({
  // existing fields
  title: z.string().min(1),
  description: z.string().min(1),
  // ... other existing fields
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const updateJobSchema = z.object({
  // existing fields
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  // ... other existing fields
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
}).refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "budgetMax must be greater than or equal to budgetMin when both are provided",
  path: ["budgetMax"],
});