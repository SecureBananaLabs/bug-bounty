import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  },
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);