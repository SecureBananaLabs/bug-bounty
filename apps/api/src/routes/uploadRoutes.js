import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Upload request must include a "file" field.',
    });
  }
  next();
}, upload.single("file"), uploadFile);
