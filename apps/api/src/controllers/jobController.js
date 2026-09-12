import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
    res.status(200).json(response.success(jobs));
  }

  async detectLowHangingFruit(req, res) {
    try {
      const issues = await this.jobService.detectLowHangingFruit();
      res.status(200).json(response.success(issues, 'Low hanging fruit issues created'));
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
