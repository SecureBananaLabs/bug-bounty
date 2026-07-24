import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided in the upload request.", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
