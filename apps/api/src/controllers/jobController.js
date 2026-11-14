import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, getJobById, listJobs } from "../services/jobService.js";

export async function getJobs(req, res, next) {
  try {
    return ok(res, await listJobs());
  } catch (err) {
    next(err);
  }
}

export async function getJob(req, res, next) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }
    return ok(res, job);
  } catch (err) {
    next(err);
  }
}

export async function postJob(req, res, next) {
  try {
    const payload = createJobSchema.parse(req.body);
    return ok(res, await createJob(payload), 201);
  } catch (err) {
    next(err);
  }
}
