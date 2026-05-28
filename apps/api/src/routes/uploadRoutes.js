import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), catchAsync(uploadFile));
