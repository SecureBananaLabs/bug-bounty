import { ok } from "../utils/response.js";
import { sanitizeUploadFilename } from "../utils/uploadFilename.js";

export async function uploadFile(req, res) {
  return ok(res, {
    filename: sanitizeUploadFilename(req.file?.originalname),
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
