import { Router } from 'express';
import { login, register, refreshToken } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/oauth/:provider', login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

export default router;