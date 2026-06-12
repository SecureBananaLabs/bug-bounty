import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

// Bound the in-memory upload so a single oversized file cannot exhaust the
// process. 5 MiB is generous for typical avatar / portfolio uploads while
// still preventing accidental multi-gigabyte buffering.
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE }
});

// Translate multer errors (notably LIMIT_FILE_SIZE) into controlled HTTP
// responses. Any non-multer error is forwarded to the global error handler.
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large", 413);
    }
    return fail(res, "Upload failed", 400);
  }
  return next(err);
}

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), handleUploadErrors, uploadFile);
