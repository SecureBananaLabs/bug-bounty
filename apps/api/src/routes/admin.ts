import express, { Router } from 'express';
import authenticate from '../middleware/auth';

const adminRouter: Router = express.Router();

adminRouter.use(authenticate);

adminRouter.get('/metrics', (req, res) => {
  // Metrics endpoint logic
  res.send('Metrics');
});

export default adminRouter;