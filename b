import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const EXISTING_USER = {
  id: 'usr_existing',
    };
  }

  static async refreshToken({ sub, role }: { sub: string; role: string }) {
    const accessToken = signAccessToken({ sub, role });
    const refreshToken = signRefreshToken({ sub, role });

    return {
      accessToken,