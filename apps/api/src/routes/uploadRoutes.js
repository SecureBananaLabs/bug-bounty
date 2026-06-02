import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC/DOCX files are allowed."));
    }
    cb(null, true);
  }
});

const uploadSingle = upload.single("file");

export const uploadRoutes = Router();

uploadRoutes.post("/", (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload validation failed"
      });
    }
    // Also validate empty upload if file is missing
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }
    next();
  });
}, uploadFile);
