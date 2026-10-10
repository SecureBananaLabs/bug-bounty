import { ok, fail } from '../utils/response.js';
import { createJob } from '../services/jobService.js';
import { createJobSchema } from '../validators/jobValidators.js';

export async function postJob(req, res, next) {
  try {
    const payload = createJobSchema.parse(req.body);
    return ok(res, await createJob(payload), 201);
  } catch (err) {
    if (err.issues) {
      return fail(res, err.issues, 400);
    }
    return next(err);
  }
}
