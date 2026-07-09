const { z } = require('zod');

const finiteNonnegativeNumber = z.number().nonnegative().refine(
  (val) => Number.isFinite(val),
  { message: 'Budget must be a finite number' }
);

const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  budgetMin: finiteNonnegativeNumber,
  budgetMax: finiteNonnegativeNumber,
  category: z.string().min(1),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

const updateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  budgetMin: finiteNonnegativeNumber.optional(),
  budgetMax: finiteNonnegativeNumber.optional(),
  category: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

module.exports = { createJobSchema, updateJobSchema };
