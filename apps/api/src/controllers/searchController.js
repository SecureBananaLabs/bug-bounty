import { z } from "zod";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const searchSchema = z.object({
  q: z.string().max(200).optional()
});

export async function search(req, res) {
  const validated = searchSchema.safeParse(req.query);
  if (!validated.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid search query",
      errors: validated.error.flatten()
    });
  }
  const { q } = validated.data;
  return ok(res, await globalSearch(q ?? ""));
}
