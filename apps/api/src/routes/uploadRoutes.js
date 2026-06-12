import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { upload } from "../middleware/uploadValidation.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
