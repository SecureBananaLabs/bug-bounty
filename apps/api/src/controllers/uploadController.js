import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  const sanitizedFilename = req.file?.originalname?.replace(/[^a-zA-Z0-9.\-_]/g, "_") ?? null;
  return ok(res, {
    filename: sanitizedFilename,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
