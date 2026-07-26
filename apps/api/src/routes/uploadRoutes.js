import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  }
});

export const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);

uploadRoutes.post("/", upload.single("file"), uploadFile);
