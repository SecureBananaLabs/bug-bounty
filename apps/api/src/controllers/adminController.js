import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res, next) {
  try {
    return ok(res, await getAdminMetrics());
  } catch (err) {
    next(err);
  }
}
