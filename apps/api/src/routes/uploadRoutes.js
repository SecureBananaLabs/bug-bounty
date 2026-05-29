import { Router } from "express";
import multer from "multer";

// 文件上传安全限制
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // 单次只允许上传 1 个文件
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      const err = new Error(`不支持的文件类型: ${file.mimetype}`);
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

import { uploadFile } from "../controllers/uploadController.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
