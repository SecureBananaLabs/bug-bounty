import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res, next) {
  let payload;
  try {
    payload = createJobSchema.parse(req.body);
  } catch (error) {
    // Express does not unwrap a rejected async handler, so the validation
    // failure has to be forwarded for the error middleware to format it.
    return next(error);
  }
  return ok(res, await createJob(payload), 201);
}
