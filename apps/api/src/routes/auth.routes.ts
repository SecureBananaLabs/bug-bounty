import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { authController } from '../controllers/auth.controller';
import { refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/oauth/:provider', authController.oauthCallback);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

export default router;