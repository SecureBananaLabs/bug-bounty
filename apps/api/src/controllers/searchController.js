import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;
const SAFE_QUERY_REGEX = /^[a-zA-Z0-9\s\-_.@]+$/;

export async function search(req, res) {
  const query = req.query.q ?? "";

  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ success: false, message: "Search query too long" });
  }
  if (query && !SAFE_QUERY_REGEX.test(query)) {
    return res.status(400).json({ success: false, message: "Search query contains invalid characters" });
  }

  return ok(res, await globalSearch(query));
}
