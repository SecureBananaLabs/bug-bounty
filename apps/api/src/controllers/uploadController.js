import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }
  if (req.file.size === 0) {
    return fail(res, "Empty file is not allowed", 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
