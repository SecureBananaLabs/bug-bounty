import { z } from 'zod';

// Existing schema (this is a simplified representation)
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  // ... other fields
}).refine(data => data.budgetMin <= data.budgetMax, {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ['budgetMin', 'budgetMax']
});

// Additional validation for partial updates
export const updateJobSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  // ... other fields
}).refine(data => {
  // Only validate if both fields are present
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ['budgetMin', 'budgetMax']
});

// If we only have access to modify existing files, let's assume there's a validation file somewhere in the structure
// Since we can't see the actual validation files, I'll create a new validation enhancement

export const jobValidationEnhancement = `
// Budget range validation
.refine(data => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "budgetMin must be less than or equal to budgetMax",
  path: ['budgetMin', 'budgetMax']
});
`;