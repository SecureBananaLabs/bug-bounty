import { ok } from "../utils/response.js";
import { sanitizeFilename } from "../utils/sanitizeFilename.js";

export async function uploadFile(req, res) {
  const originalname = req.file?.originalname;
  const filename = req.file
    ? (originalname !== undefined && originalname !== null ? sanitizeFilename(originalname) : "file")
    : null;

  return ok(res, {
    filename,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
