import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

function toInteger(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export async function getJobs(req, res) {
  const limit = toInteger(req.query.limit);
  const offset = toInteger(req.query.offset);

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return fail(res, "limit must be an integer between 1 and 100", 400);
  }

  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    return fail(res, "offset must be a non-negative integer", 400);
  }

  if (limit === undefined && offset === undefined) {
    return ok(res, await listJobs());
  }

  return ok(res, await listJobs({ limit, offset }));
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
