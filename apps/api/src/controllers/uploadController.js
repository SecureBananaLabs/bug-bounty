import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  // A multipart request without a `file` field is not a successful upload.
  // Reject it with a clear 400 instead of returning 201 with status "no-file".
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }

  return ok(res, {
    filename: req.file.originalname ?? null,
    status: "uploaded"
  }, 201);
}
