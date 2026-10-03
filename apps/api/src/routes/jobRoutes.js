import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
router.get('/', jobController.getJobs);
router.get('/:jobId', jobController.getJobById);
router.put('/:jobId/status', auth, authorize('admin'), jobController.updateJobStatus);
router.post('/detect-low-hanging-fruit', auth, authorize('admin'), jobController.detectLowHangingFruit);

module.exports = router;
