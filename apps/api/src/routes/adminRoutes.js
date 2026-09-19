import { Router } from 'express';
import { metrics } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';
import { fail } from '../utils/response.js';

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);

// 管理员角色验证中间件
adminRoutes.use((req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return fail(res, 'Unauthorized', 403);
});

adminRoutes.get('/metrics', metrics);