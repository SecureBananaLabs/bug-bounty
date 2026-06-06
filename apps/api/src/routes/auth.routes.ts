import { Request, Response } from 'express';
import { register } from '../controllers/auth.controller';
import { Router } from 'express';

const router = Router();

router.post('/register', register);

export default router;

// The fix would typically be in the controller, but since we can't see the controller file,
// we'll assume the routes file needs to be modified to prevent admin role assignment

// This is a placeholder - the actual implementation would be in the controller
export default router;