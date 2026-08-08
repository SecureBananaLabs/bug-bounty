import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';
import { ForbiddenError } from '../errors';

const router = Router();
const adminController = new AdminController();
router.patch(
  '/users/:userId/role',
  requireAdmin,
  (req, res, next) => {
    if (req.params.userId === req.user?.id) {
      return next(new ForbiddenError('Admins cannot modify their own role'));
    }
    next();
  },
  adminController.updateUserRole.bind(adminController)
);

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ForbiddenError, UnauthorizedError } from '../errors';

export interface AuthenticatedRequest extends Request {
  user?: {
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Unauthorized');
  }

  const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = payload as AuthenticatedRequest['user'];
  } catch {
    throw new UnauthorizedError('Unauthorized');
  }

  next();
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenError('Forbidden');
    }
    next();
  });
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}