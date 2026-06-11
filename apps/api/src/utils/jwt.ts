import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '15m';
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): (JwtPayload & { sub: string; role: string }) | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { sub: string; role: string };
    return decoded;
  } catch {
    return null;
  }
};