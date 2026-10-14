import { Router } from 'express';
import { createJob, updateJob, getJob, listJobs, deleteJob } from '../controllers/jobController.js';
import { createJobSchema, updateJobSchema } from '../validation/jobValidation.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/', validate(createJobSchema), createJob);
router.get('/', listJobs);
router.get('/:id', getJob);
router.put('/:id', validate(updateJobSchema), updateJob);
router.patch('/:id', validate(updateJobSchema), updateJob);
router.delete('/:id', deleteJob);

export { router as jobRoutes };
