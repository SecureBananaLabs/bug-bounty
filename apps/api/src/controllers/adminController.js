import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const metrics = asyncHandler(async (req, res) => {
  return ok(res, await getAdminMetrics());
});
