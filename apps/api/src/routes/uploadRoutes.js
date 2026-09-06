import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

// 只放行常见的文档和图片格式，别让奇怪的文件混进来
const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv"
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB，够用但不给攻击者留空间

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);

// 兜住 multer 自己的错误（文件太大、类型不对），返回 400 而不是 500
uploadRoutes.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
      LIMIT_UNEXPECTED_FILE: "File type not allowed."
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || "Upload error."
    });
  }
  next(err);
});