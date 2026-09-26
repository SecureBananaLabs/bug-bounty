import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "A file is required", 400);
  }

  if (req.file.size === 0) {
    return fail(res, "Uploaded file must not be empty", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
