import { z } from "zod";
import { ok } from "../utils/response.js";
import { searchAll } from "../services/searchService.js";

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query required").max(200, "Query too long")
});

export async function search(req, res) {
  const { q } = searchQuerySchema.parse(req.query);
  return ok(res, await searchAll(q));
}
