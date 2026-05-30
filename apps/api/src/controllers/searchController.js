import { z } from "zod";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const searchQuerySchema = z.object({
  q: z.string().max(200).transform(v => v.trim())
});

export async function search(req, res) {
  const { q } = searchQuerySchema.parse(req.query);
  return ok(res, await globalSearch(q));
}
