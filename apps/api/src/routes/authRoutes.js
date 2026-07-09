import { Router } from 'express';
import { registerSchema } from '../validation/authValidation.js';
import { validate } from '../middleware/validate.js';
import { registerUser, loginUser, refreshToken, logoutUser } from '../services/authService.js';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, role, fullName } = req.body;
    const user = await registerUser({ email, password, role, fullName });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// other routes unchanged...

export { router as authRoutes };
