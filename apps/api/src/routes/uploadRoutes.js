import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/gif", "application/pdf"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error("Unsupported file type");
      error.status = 400;
      error.code = "UNSUPPORTED_FILE_TYPE";
      return cb(error);
    }

    return cb(null, true);
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
