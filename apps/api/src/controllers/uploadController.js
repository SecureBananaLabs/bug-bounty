import { ok } from "../utils/response.js";
import { sanitizeFilename } from "../utils/filename.js";

export async function uploadFile(req, res) {
  return ok(res, {
    filename: sanitizeFilename(req.file?.originalname),
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
