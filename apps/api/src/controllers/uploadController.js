import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file || req.file.size === 0) {
    return fail(res, "File is required and must not be empty", 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
