import express, { Router } from 'express';
import { createMessage } from '../controllers/message.controller';

const router: Router = express.Router();

// ...

router.post('/messages', createMessage);

export default router;