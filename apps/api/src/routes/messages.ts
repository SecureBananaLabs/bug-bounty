import express, { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { messageController } from '../controllers/messageController';

const messagesRouter: Router = express.Router();

// Apply auth middleware to all message routes
messagesRouter.use(authMiddleware);

messagesRouter.get('/', messageController.getMessages);
messagesRouter.post('/', messageController.createMessage);

export default messagesRouter;