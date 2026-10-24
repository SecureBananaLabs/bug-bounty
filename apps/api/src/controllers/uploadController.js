import path from "node:path";
import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  const sanitizedFilename = path.basename(req.file.originalname);

  return ok(res, {
    filename: sanitizedFilename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
