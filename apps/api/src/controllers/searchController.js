import { z } from 'zod';
import { searchService } from '../services/searchService.js';

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});

/**
 * Search controller with input validation and sanitization.
 * Trims the query, enforces a 200-character limit, and strips HTML tags.
 */
export async function searchController(req, res, next) {
  try {
    const queryResult = searchQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameter',
        details: queryResult.error.issues,
      });
    }

    let query = queryResult.data.q;
    // Basic sanitization: remove HTML tags and dangerous characters
    query = query.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '');

    const results = await searchService.search(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
