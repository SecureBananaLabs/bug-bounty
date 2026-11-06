import { ok } from "../utils/response.js";
import { createJob, listJobs } from "../services/jobService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getJobs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listJobs({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postJob(req, res) {
  return ok(res, await createJob(req.body), 201);
}
