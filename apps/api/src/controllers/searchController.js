import { z } from 'zod';
import * as searchService from '../services/searchService.js';

const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be at most 200 characters'),
});

/**
 * Handle GET /api/search
 * Validates and sanitizes the query before passing to the search service.
 */
export async function search(req, res, next) {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    // Basic sanitization: remove potential harmful characters (HTML tags, quotes)
    const sanitizedQ = q.replace(/[<>"'&]/g, '');
    const results = await searchService.search(sanitizedQ);
    res.json({ results });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search query',
        details: err.errors,
      });
    }
    next(err);
  }
}
