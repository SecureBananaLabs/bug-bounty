import path from "node:path";
import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  const sanitizedFilename = path.basename(req.file.originalname).replace(/[\r\n\0]/g, "");

  return ok(res, {
    filename: sanitizedFilename,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
