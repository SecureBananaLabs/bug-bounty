import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let q = req.query.q;
  if (q !== undefined) {
    if (Array.isArray(q)) {
      q = q[0];
    }
    if (typeof q === 'string') {
      q = q.trim();
      if (q.length > 200) {
        return res.status(400).json({ error: 'Search query must be 200 characters or less', message: 'Search query must be 200 characters or less' });
      }
      q = q.replace(/<[^>]*>/g, '');
      req.query.q = q;
    } else {
      req.query.q = '';
    }
  }

  return ok(res, await globalSearch(req.query.q ?? ""));
}
