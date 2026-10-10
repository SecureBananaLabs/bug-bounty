import { Request, Response } from 'express';
import { generateToken, verifyToken } from '../utils/jwt';
import { RefreshTokenBody } from '../schemas/auth.schema';

const users = [
  { id: 'usr_existing', email: 'test@example.com', password: 'password123', role: 'freelancer' },
  }
};

export const refreshToken = (req: Request<{}, {}, RefreshTokenBody>, res: Response) => {
  const { token } = req.body;

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const { sub, role } = decoded;
  if (!sub || !role) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }

  const accessToken = generateToken(sub, role);
  return res.json({ accessToken });
};

export const oauthCallback = (req: Request, res: Response) => {