import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const authService = {
  async register(data: any) {
    };
  },

  async refreshToken(sub: string, role: string) {
    const accessToken = generateAccessToken(sub, role);
    return {
      accessToken,
    };