import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file uploaded. Attach a multipart field named 'file'.", 400);
  }

  return ok(res, {
    filename: req.file.originalname ?? null,
    size: req.file.size ?? null,
    mimetype: req.file.mimetype ?? null,
    status: "uploaded"
  }, 201);
}
