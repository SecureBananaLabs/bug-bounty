import { Router } from "express";
import multer from "multer";
import { fail } from "../utils/response.js";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), (req, res, next) => {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }
  next();
}, uploadFile);
