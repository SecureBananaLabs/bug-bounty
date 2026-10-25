import { searchService } from '../services/searchService.js';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200, 'Search query must be at most 200 characters')
    .optional()
    .default(''),
});

export async function searchController(req, res, next) {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).json({ error: 'Invalid search query', details: errors });
    }

    const { q } = parsed.data;
    const results = await searchService.search(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
