import { fail } from "../utils/response.js";

/**
 * Middleware: 验证当前用户是否为 ADMIN 角色
 * 依赖 authMiddleware 先运行（req.user 已设置）
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return fail(res, "Unauthorized", 401);
  }
  if (req.user.role !== "ADMIN") {
    return fail(res, "Forbidden: admin access required", 403);
  }
  return next();
}
