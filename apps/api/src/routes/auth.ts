import { Router } from 'express';
import { z } from 'zod';
import { generateToken, refreshToken, verifyToken } from '../utils/jwt';
import { RefreshTokenSchema } from '../schemas/auth';

const router = Router();

});

router.post('/refresh', async (req, res) => {
  const parseResult = RefreshTokenSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const { token } = parseResult.data;
  const decoded = verifyToken(token);

  if { decoded === null) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const newAccessToken = refreshToken(decoded.sub, decoded.role);
  return res.json({ accessToken: newAccessToken });
});

export default router;