import { ok } from "../utils/response.js";
import {
  getAdminMetrics,
  getAdminOverview,
  updatePlatformControls
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function overview(req, res) {
  return ok(res, getAdminOverview());
}

export async function platformControls(req, res) {
  return ok(res, updatePlatformControls(req.user.sub, req.body ?? {}));
}
