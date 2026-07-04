import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }
  if (req.file.size === 0) {
    return fail(res, "File is empty", 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
