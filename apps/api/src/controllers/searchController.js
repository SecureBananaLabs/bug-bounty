import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { z } from "zod";

const searchQuerySchema = z.string().max(200).regex(
  /^[\w\s\-\.\,\@]+$/,
  "Query contains invalid characters"
);

export async function search(req, res) {
  const q = (req.query.q ?? "").trim();
  if (!q) return ok(res, []);

  try {
    searchQuerySchema.parse(q);
  } catch (err) {
    return res.status(400).json({ error: "Invalid search query", details: err.errors });
  }

  return ok(res, await globalSearch(q));
}
