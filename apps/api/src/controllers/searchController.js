import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

import { z } from "zod";

const searchSchema = z.string().min(0).max(200);

export async function search(req, res) {
  return ok(res, await globalSearch(searchSchema.parse(req.query.q ?? "")));
}
