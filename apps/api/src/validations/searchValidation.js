import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional()
    .default(''),
});
