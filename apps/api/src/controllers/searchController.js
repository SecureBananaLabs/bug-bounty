import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
    const q = req.query.q;

    // Reject missing or blank search queries (issue #9686).
    if (typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required and must not be blank.',
      });
    }

}
