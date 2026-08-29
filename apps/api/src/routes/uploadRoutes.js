import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
    return cb(null, true);
  }
});

export const uploadRoutes = Router();

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof Error && error.message === "UNSUPPORTED_FILE_TYPE") {
      return fail(res, "Unsupported file type", 400);
    }

    return next(error);
  });
}

uploadRoutes.post("/", handleUpload, uploadFile);
