import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { uploadFile } from "../controllers/uploadController.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DISALLOWED_EXTENSIONS = new Set([".exe", ".sh", ".bat", ".php", ".cmd", ".vbs", ".dll", ".so"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (DISALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("Executable and dangerous file extensions are prohibited"));
    }
    cb(null, true);
  }
});

export const uploadRoutes = Router();

uploadRoutes.post(
  "/",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File exceeds 10MB limit" });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  uploadFile
);
