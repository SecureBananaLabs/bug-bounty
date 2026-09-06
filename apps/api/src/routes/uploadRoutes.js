import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/json",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      const err = new Error(`Unsupported file type: ${file.mimetype}`);
      err.name = "MulterError";
      err.code = "LIMIT_UNSUPPORTED_FILE_TYPE";
      cb(err, false);
    }
  },
});

export const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);
uploadRoutes.post("/", upload.single("file"), uploadFile);
