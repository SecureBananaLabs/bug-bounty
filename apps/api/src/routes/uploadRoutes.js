import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), asyncHandler(uploadFile));
