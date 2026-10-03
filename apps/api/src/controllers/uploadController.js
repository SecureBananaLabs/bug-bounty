import { fail, ok } from "../utils/response.js";

const EMPTY_FILE_MESSAGE = "file is required and must not be empty";

export async function uploadFile(req, res) {
  if (!req.file || !req.file.buffer || req.file.size <= 0) {
    return fail(res, EMPTY_FILE_MESSAGE, 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
