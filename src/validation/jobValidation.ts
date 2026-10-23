import { z } from 'zod';

// Define the job budget schema with min <= max constraint
const JobBudgetSchema = z.object({
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0).gte(z.number().field('budgetMin')) // Ensures max >= min
});

// Main job creation schema
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  // ... other fields
});

// Schema for partial updates that preserve existing valid ranges
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional().refine(
    (value, context) => {
      const budgetMin = context.parent.budgetMin;
      const budgetMax = context.parent.budgetMax;
      
      // If both fields are present, enforce order
      if (budgetMin !== undefined && budgetMax !== undefined) {
        return budgetMax >= budgetMin;
      }
      return true;
    },
    {
      message: 'budgetMax must not be less than budgetMin',
      path: ['budgetMax']
    }
  )
});

// Reusable schema for existing job records (no strict validation on existing valid data)
export const jobRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  // ... other fields
});