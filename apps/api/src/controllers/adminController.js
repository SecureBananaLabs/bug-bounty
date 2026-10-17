import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admin role required" });
  }
  return ok(res, await getAdminMetrics());
}
