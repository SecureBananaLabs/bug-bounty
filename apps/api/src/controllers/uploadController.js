import { ok } from "../utils/response.js";

export function sanitizeFilename(originalname) {
  if (typeof originalname !== "string") {
    return null;
  }

  const filename = originalname
    .replaceAll("\\", "/")
    .split("/")
    .at(-1)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 100);

  return filename || null;
}

export async function uploadFile(req, res) {
  return ok(res, {
    filename: sanitizeFilename(req.file?.originalname),
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
