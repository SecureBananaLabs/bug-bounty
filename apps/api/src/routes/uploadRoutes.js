import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);

export default uploadRoutes;
