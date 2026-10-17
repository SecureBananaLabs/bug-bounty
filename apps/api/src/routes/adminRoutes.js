import express from 'express';
import { adminGuard } from '../middleware/adminGuard.js';
import { 
  getUsers, 
  suspendUser, 
  getFlaggedJobs, 
  resolveJobFlag 
} from '../controllers/adminController.js';

export const adminRoutes = express.Router();

// Apply admin guard to all routes
adminRoutes.use(adminGuard);

// User management
adminRoutes.get('/users', getUsers);
adminRoutes.put('/users/:userId/suspend', suspendUser);

// Job moderation
adminRoutes.get('/jobs/flagged', getFlaggedJobs);
adminRoutes.put('/jobs/:jobId/resolve', resolveJobFlag);
