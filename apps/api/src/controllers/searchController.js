import { searchService } from '../services/searchService.js';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200, 'Query must be at most 200 characters')
    .optional()
    .default(''),
});

export async function searchController(req, res, next) {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid search query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { q } = parsed.data;
    const results = await searchService.search(q);
    return res.json({ results });
  } catch (err) {
    next(err);
  }
}

export default searchController;
