import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const search = asyncHandler(async (req, res) => {
  return ok(res, await globalSearch(req.query.q ?? ""));
});
