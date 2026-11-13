import { ok } from "../utils/response.js";
import { createJobSchema, updateJobStatusSchema } from "../validators/job.js";
import { createJob, listJobs, updateJobStatus } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}

export async function patchJob(req, res) {
  const { id } = req.params;
  const result = updateJobStatusSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid status",
      errors: result.error.issues,
    });
  }
  try {
    return ok(res, await updateJobStatus(id, result.data.status));
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
}
