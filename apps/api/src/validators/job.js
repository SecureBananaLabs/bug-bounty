import { z } from 'zod';

// Job creation schema
const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  categoryId: z.string().min(1).max(50),
  skills: z.array(z.string().min(1).max(30)).max(20).optional(),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  durationWeeks: z.number().int().positive().max(52).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  location: z.string().max(200).optional(),
});

// Job update schema
const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  categoryId: z.string().min(1).max(50).optional(),
  skills: z.array(z.string().min(1).max(30)).max(20).optional(),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  durationWeeks: z.number().int().positive().max(52).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  location: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'FILLED', 'CANCELLED']).optional(),
});

// Job query schema
const jobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  categoryId: z.string().max(50).optional(),
  skills: z.string().optional(), // comma-separated
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  budgetMin: z.coerce.number().int().positive().optional(),
  budgetMax: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['createdAt', 'budgetMin', 'budgetMax', 'durationWeeks']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export { createJobSchema, updateJobSchema, jobQuerySchema };