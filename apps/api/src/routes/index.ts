import { Router } from 'express';
import { healthCheck } from './health';
import { users } from './users';

export const router = Router();

router.use('/health', healthCheck);
router.use('/users', users);
