import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(10000),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  categoryId: z.string(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  estimatedDuration: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']).optional(),
}).refine((data) => {
  // Reject inverted budget ranges
  if (data.budgetMax !== undefined && data.budgetMin !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(10000).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  categoryId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  estimatedDuration: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']).optional(),
}).refine((data) => {
  // Reject inverted budget ranges when both fields are present
  if (data.budgetMax !== undefined && data.budgetMin !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});