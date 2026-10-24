import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 2 },
  fileFilter(_req, file, cb) {
    const filename = String(file?.originalname || "");
    const ext = filename.toLowerCase().split(".").pop();
    if (!filename || !filename.includes(".") || filename !== `${filename.replace(/[\\\/]/g, "")}`) {
      return cb(new Error("Invalid file name"), false);
    }

    const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif", "pdf"]);
    const allowedMimeTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);

    if (!allowedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype || "")) {
      return cb(new Error("Invalid file"), false);
    }
    cb(null, true);
  },
});

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
