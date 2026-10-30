import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { uploadFile } from "../controllers/uploadController.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DISALLOWED_EXTENSIONS = new Set([".exe", ".sh", ".bat", ".cmd", ".php", ".phtml", ".pl", ".py"]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error("Executable file types are not allowed");
    err.status = 400;
    return cb(err, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

export const uploadRoutes = Router();

uploadRoutes.post(
  "/",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE" ? "File too large. Maximum size is 10MB" : err.message
          });
        }
        return res.status(err.status || 400).json({
          success: false,
          message: err.message || "Upload failed"
        });
      }
      next();
    });
  },
  uploadFile
);
