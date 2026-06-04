import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(5000),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  categoryId: z.string(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  deadline: z.date().optional(),
}).refine(
  (data) => {
    // Reject inverted budget ranges
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'budgetMin must be less than or equal to budgetMax',
    path: ['budgetMax'],
  }
);

export const updateJobSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  categoryId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  deadline: z.date().optional(),
}).refine(
  (data) => {
    // Reject inverted budget ranges when both fields are present
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'budgetMin must be less than or equal to budgetMax',
    path: ['budgetMax'],
  }
);