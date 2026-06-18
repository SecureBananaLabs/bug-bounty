import { z } from 'zod';
import { searchService } from '../services/searchService.js';

const searchQuerySchema = z.object({
  q: z.string().trim().max(200, 'Search query must be at most 200 characters').optional().default(''),
});

function sanitize(input) {
  // Basic sanitization: escape HTML special characters
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

export async function search(req, res, next) {
  try {
    const parseResult = searchQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query parameter', details: parseResult.error.flatten() });
    }
    const q = sanitize(parseResult.data.q);
    const results = await searchService.search(q);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}
