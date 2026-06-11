import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret';
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyRefreshToken(token: string): { sub: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload & { sub: string; role: string };
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}