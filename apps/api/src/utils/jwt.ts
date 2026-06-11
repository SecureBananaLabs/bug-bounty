import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.sub || !decoded.role) {
      return null;
    }
    return { sub: decoded.sub as string, role: decoded.role as string };
  } catch {
    return null;
  }
}