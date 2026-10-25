import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function sanitizeQuery(raw) {
  return raw
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function search(req, res) {
  const raw = req.query.q;

  if (raw === undefined) {
    return ok(res, await globalSearch(""));
  }

  if (typeof raw !== "string") {
    return fail(res, "q must be a single string value");
  }

  const query = sanitizeQuery(raw);

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `q must not exceed ${MAX_QUERY_LENGTH} characters`);
  }

  return ok(res, await globalSearch(query));
}
