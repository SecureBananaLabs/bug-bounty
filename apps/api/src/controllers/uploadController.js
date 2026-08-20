import { ok } from "../utils/response.js";

const MAX_UPLOAD_FILENAME_LENGTH = 120;

export function sanitizeUploadFilename(filename) {
  if (typeof filename !== "string") {
    return null;
  }

  const basename = filename
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .trim();

  return (basename || "upload").slice(0, MAX_UPLOAD_FILENAME_LENGTH);
}

export async function uploadFile(req, res) {
  return ok(res, {
    filename: req.file ? sanitizeUploadFilename(req.file.originalname) : null,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
