import { Router } from 'express';
import { getUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { preventAdminSelfAssignment } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:id', getUser);
router.put('/:id', preventAdminSelfAssignment, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;