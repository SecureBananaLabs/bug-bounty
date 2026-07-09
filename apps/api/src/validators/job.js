const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  budgetMin: z.number().positive('Budget min must be positive'),
  budgetMax: z.number().positive('Budget max must be positive'),
  category: z.string().min(1, 'Category is required'),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  duration: z.string().optional(),
}).refine(
  (data) => data.budgetMin <= data.budgetMax,
  {
    message: 'budgetMin must be less than or equal to budgetMax',
    path: ['budgetMin'],
  }
);

const updateJobSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  duration: z.string().optional(),
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'budgetMin must be less than or equal to budgetMax',
    path: ['budgetMin'],
  }
);

module.exports = { createJobSchema, updateJobSchema };
