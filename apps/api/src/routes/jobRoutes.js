import { Router } from 'express';
import { jobController } from '../controllers/jobController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createJobSchema, updateJobSchema } from '../validation/jobValidation.js';

const router = Router();

// Create a job – requires auth and validation
router.post('/',
  authMiddleware,
  validate(createJobSchema),
  jobController.createJob
);

// Get all jobs (public)
router.get('/', jobController.getJobs);

// Get job by ID
router.get('/:id', jobController.getJobById);

// Update a job – requires auth and validation
router.patch('/:id',
  authMiddleware,
  validate(updateJobSchema),
  jobController.updateJob
);

// Delete a job – requires auth
router.delete('/:id', authMiddleware, jobController.deleteJob);

export { router as jobRoutes };
