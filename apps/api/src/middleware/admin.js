import { fail } from "../utils/response.js";
import { getAdminData } from "../services/adminData.js";

export function adminMiddleware(req, res, next) {
  const adminId = req.user?.sub;
  if (!adminId) {
    return fail(res, "Unauthorized", 401);
  }

  const currentUser = getAdminData().users.find((user) => user.id === adminId);
  if (!currentUser || currentUser.role !== "admin" || currentUser.status !== "active") {
    return fail(res, "Forbidden", 403);
  }

  req.admin = currentUser;
  return next();
}

