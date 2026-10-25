import { ok, notFound, fail } from "../utils/response.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";
import { createJob, listJobs, getJobById, updateJob } from "../services/jobService.js";
import { ZodError } from "zod";

/**
 * Handle Zod validation errors and return proper error response
 */
function handleZodError(res, error) {
  if (error instanceof ZodError) {
    const messages = error.issues.map(issue => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    return fail(res, "Validation failed", 400, messages);
  }
  throw error; // Re-throw non-Zod errors
}

export async function getJobs(req, res) {
  try {
    return ok(res, await listJobs());
  } catch (error) {
    return fail(res, "Failed to fetch jobs", 500);
  }
}

export async function getJob(req, res) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return notFound(res, "Job not found");
    return ok(res, job);
  } catch (error) {
    return fail(res, "Failed to fetch job", 500);
  }
}

export async function postJob(req, res) {
  try {
    const payload = createJobSchema.parse(req.body);
    return ok(res, await createJob(payload), 201);
  } catch (error) {
    return handleZodError(res, error);
  }
}

export async function patchJob(req, res) {
  try {
    const payload = updateJobSchema.parse(req.body);
    const job = await updateJob(req.params.id, payload);
    if (!job) return notFound(res, "Job not found");
    return ok(res, job);
  } catch (error) {
    return handleZodError(res, error);
  }
}
