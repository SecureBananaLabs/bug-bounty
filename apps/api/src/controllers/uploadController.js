import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  // Reject empty submissions with 400 instead of returning 201 with
  // status:'no-file' — HTTP status code must be authoritative, callers
  // should not need to inspect the response body to detect upload failure.
  if (!req.file) {
    return fail(res, "No file provided. Upload requires a multipart file field.", 400);
  }
  return ok(res, { filename: req.file.originalname, status: "uploaded" }, 201);
}
