import { z } from "zod";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const searchQuerySchema = z.string().trim().min(1).max(200);

export async function search(req, res) {
  const q = req.query.q;

  const parseResult = searchQuerySchema.safeParse(q);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid query parameter" });
  }

  return ok(res, await globalSearch(parseResult.data));
}
