import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret';
    expiresIn: '7d',
  });
}

export function verifyRefreshToken(token: string): JwtPayload & { sub: string; role: string } {
  const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload & { sub: string; role: string };
  return decoded;
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}