import { generateAccessToken } from '../utils/jwt';

export function refreshToken(sub: string, role: string): string {
  return generateAccessToken(sub, role);
}