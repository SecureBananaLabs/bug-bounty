import { ok, fail } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { listJobs } from "../services/jobService.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback, { min = 1, max = Infinity } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    return null;
  }
  return n;
}

export async function getJobs(req, res) {
  const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, { min: 1, max: MAX_LIMIT });
  const offset = parsePositiveInt(req.query.offset, 0, { min: 0 });

  if (limit === null || offset === null) {
    return fail(res, "Invalid pagination: 'limit' must be 1-100 and 'offset' must be >= 0", 400);
  }

  return ok(res, await listJobs({ limit, offset }));
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
