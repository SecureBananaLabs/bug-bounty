import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { requireUploadFile } from "../middleware/requireUploadFile.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), requireUploadFile, uploadFile);
