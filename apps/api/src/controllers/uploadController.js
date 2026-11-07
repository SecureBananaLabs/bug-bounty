import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }

  if (req.file.size === 0) {
    return fail(res, "Empty file not allowed", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
