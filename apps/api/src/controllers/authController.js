import { refreshToken } from '../services/authService.js';

export const refresh = async (req, res, next) => {
  try {
    const { sub: userId, role } = req.user;
    const { accessToken } = await refreshToken({ userId, role });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};
