import express, { Router } from 'express';
import messagesRouter from './messages';

const router: Router = express.Router();

router.use('/api/messages', messagesRouter);

export default router;