import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
export function generateRefreshToken(sub: string, role: string): string {
  return jwt.sign({ sub, role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyRefreshToken(token: string): { sub: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload;
    if (!decoded.sub || !decoded.role) {
      return null;
    }
    return { sub: decoded.sub as string, role: decoded.role as string };
  } catch (error) {
    return null;
  }
}