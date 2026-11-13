import { ZodError } from "zod";
import { fail, ok } from "../utils/response.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";
import { createJob, listJobs, updateJob } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}

export async function patchJob(req, res) {
  let payload;

  try {
    payload = updateJobSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, "Invalid job update payload", 400);
    }

    throw error;
  }

  const job = await updateJob(req.params.id, payload);

  if (!job) {
    return fail(res, "Job not found", 404);
  }

  return ok(res, job);
}
