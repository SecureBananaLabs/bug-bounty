import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { refreshSchema } from '../schemas/auth.schema';
import { authController } from '../controllers/auth.controller';

const router = Router();
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/oauth/:provider', authController.oauthCallback);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);

export default router;
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      
      if (!token) {
        throw new UnauthorizedError('Refresh token is required');
      }
      
      const result = await authService.refreshToken(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

    return { accessToken, refreshToken };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
      
      if (!decoded.sub || !decoded.role) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      
      const accessToken = jwt.sign(
        { sub: decoded.sub, role: decoded.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      
    return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  },
};
export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

describe('POST /api/auth/refresh', () => {
  it('should return 400 when token is missing', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    expect(response.status).toBe(400);
  });

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });
    
    expect(response.status).toBe(401);
  });

  it('should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { sub: 'usr_test', role: 'user' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ token: expiredToken });
    
    expect(response.status).toBe(401);
  });

  it('should return new access token for valid token with preserved sub and role', async () => {
    const validToken = jwt.sign(
      { sub: 'usr_test', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ token: validToken });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    
    const decoded = jwt.verify(response.body.accessToken, JWT_SECRET) as any;
    expect(decoded.sub).toBe('usr_test');
    expect(decoded.role).toBe('admin');
  });

  it('should not allow minting token without credentials', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).not.toHaveProperty('accessToken');
  });

  it('should reject empty string token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ token: '' });
    
    expect(response.status).toBe(400);
  });
});