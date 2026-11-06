import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  // An empty multipart submission is a client mistake, not a completed
  // upload, so it has to be reported as a failure instead of a 201.
  if (!req.file) {
    return fail(res, "No file provided in the file field", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
