import { ok, fail } from "../utils/response.js";
import {
  getFreelancerByUsername,
  getFreelancerById,
} from "../services/freelancerService.js";

/**
 * GET /freelancers/:usernameOrId
 * Resolves a freelancer profile by username or ID (#2849).
 */
export async function getFreelancer(req, res) {
  const param = req.params.usernameOrId;
  if (!param) {
    return fail(res, "Username or ID is required", 400);
  }

  // Try username first (more common), then ID
  let profile = await getFreelancerByUsername(param);
  if (!profile) {
    profile = await getFreelancerById(param);
  }

  if (!profile) {
    return fail(res, "Freelancer not found", 404);
  }

  return ok(res, profile);
}
