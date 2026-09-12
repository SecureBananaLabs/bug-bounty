import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LEN = 200;

function sanitizeQuery(raw) {
  if (typeof raw !== "string") return "";
  return raw
    // Remove non-whitespace control characters (NUL, BEL, etc.) and DEL.
    // Keep \t, \n, \r so they collapse to a single space below.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "")
    // Collapse all whitespace runs (incl. \t, \n, \r) to a single space.
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LEN);
}

export async function search(req, res) {
  const q = sanitizeQuery(req.query.q);
  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Query parameter 'q' is required"
    });
  }
  try {
    const results = await globalSearch(q);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
}

export { sanitizeQuery };
