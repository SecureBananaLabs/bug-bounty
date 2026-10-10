import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "Upload file is required", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
