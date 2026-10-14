import { ok, fail } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admin role required", 403);
  }
  return ok(res, await getAdminMetrics());
}
