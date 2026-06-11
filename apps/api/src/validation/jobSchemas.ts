import { z } from 'zod';
import { JobStatus, ExperienceLevel } from '@prisma/client';
import { validateBudgetRange } from '../utils/validation';

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  categoryId: z.string().uuid(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  budgetMin: z.number().positive().optional().or(z.literal(null)),
  budgetMax: z.number().positive().optional().or(z.literal(null)),
}).refine((data) => {
  return validateBudgetRange(data.budgetMin, data.budgetMax);
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});

export const updateJobSchema = z.object({
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  budgetMin: z.number().positive().optional().or(z.literal(null)),
  budgetMax: z.number().positive().optional().or(z.literal(null)),
}).refine((data) => {
  return validateBudgetRange(data.budgetMin, data.budgetMax);
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});