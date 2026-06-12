import express, { Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { messageController } from '../../controllers/messages';

const router = express.Router();

- router.post('/', messageController.createMessage);
+ router.post('/', authMiddleware, messageController.createMessage);

export default router;