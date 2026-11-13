import { fail } from "../utils/response.js";
import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  return ok(res, await getAdminMetrics());
}
