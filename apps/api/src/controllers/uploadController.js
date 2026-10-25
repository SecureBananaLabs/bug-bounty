import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
