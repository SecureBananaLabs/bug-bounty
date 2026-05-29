import { Router } from 'express';
import { register, login, refreshToken, oauthCallback } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { preventAdminSelfAssignment } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
  password: z.string().min(8),
});

router.post('/register', validateRequest(registerSchema), preventAdminSelfAssignment, register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refreshToken);
router.get('/oauth/callback', oauthCallback);
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@bug-bounty/db';
import { Role } from '@bug-bounty/db';

interface AuthenticatedRequest extends Request {
  user?: {
  }
};

export const preventAdminSelfAssignment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { role } = req.body;

  if (role === 'ADMIN' || role === Role.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Self-assignment of admin role is not permitted.',
    });
    return;
  }

  next();
};

export { AuthenticatedRequest };
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@bug-bounty/db';
import { prisma } from '@bug-bounty/db';

interface RegisterInput {
export const registerUser = async (input: RegisterInput) => {
  const { email, password, name, role } = input;

  // Defensive check: prevent admin role self-assignment at service level
  const normalizedRole = role?.toUpperCase?.() ?? role;
  if (normalizedRole === 'ADMIN' || normalizedRole === Role.ADMIN) {
    throw new Error('Self-assignment of admin role is not permitted.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role: 'USER',
    },
  });

- File uploads and search
- Admin routes

### Security Notes

- Admin role assignment is restricted to existing administrators. New registrations cannot self-assign the admin role.

Backend architecture follows:

- Middleware layer (auth, rate limiting, error handling)