import { searchQuerySchema } from '../validations/searchValidation.js';

export async function search(req, res) {
  const result = searchQuerySchema.safeParse({ q: req.query.q });
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid query parameter', details: result.error.issues });
  }
  const q = result.data.q ?? '';
  return ok(res, await globalSearch(q));
}
