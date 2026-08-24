import { ok, fail } from "../utils/response.js";
import { getAdminMetrics, updateUserRole } from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function changeUserRole(req, res) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden: Admin access required", 403);
  }

  const { id } = req.params;
  const { role } = req.body;

  if (!["client", "freelancer", "admin"].includes(role)) {
    return fail(res, "Invalid role", 400);
  }

  try {
    const updatedUser = await updateUserRole(id, role);
    return ok(res, updatedUser);
  } catch (error) {
    return fail(res, error.message, 404);
  }
}
