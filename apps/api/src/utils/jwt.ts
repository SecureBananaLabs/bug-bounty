import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
  });
}

export function verifyToken(token: string): TokenPayload | null {
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

export function refreshToken(): string {
  // Deprecated: use verifyToken + generateToken directly
  throw new Error('refreshToken() is deprecated. Use verifyToken + generateToken instead.');
}

export default { generateToken, verifyToken, refreshToken };