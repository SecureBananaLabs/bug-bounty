import { signAccessToken } from '../utils/jwt';

export async function refreshToken(sub: string, role: string): Promise<string> {
  return signAccessToken({ sub, role });
}