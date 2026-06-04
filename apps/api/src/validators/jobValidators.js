const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  budget: z.number().positive('Budget must be a positive number'),
  category: z.string().min(1, 'Category is required'),
});

module.exports = { createJobSchema };
