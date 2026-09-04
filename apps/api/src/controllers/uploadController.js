import { ok } from "../utils/response.js";

const MAX_FILENAME_LENGTH = 128;

export function sanitizeUploadFilename(filename) {
  if (!filename) {
    return null;
  }

  const basename = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  const sanitized = basename.replace(/[\u0000-\u001f\u007f]/g, "").trim();

  return (sanitized || "upload").slice(0, MAX_FILENAME_LENGTH);
}

export async function uploadFile(req, res) {
  return ok(res, {
    filename: req.file ? sanitizeUploadFilename(req.file.originalname) : null,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
