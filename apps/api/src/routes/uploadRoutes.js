import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

// Uploads are attributed to an account, so an anonymous caller must not be able
// to store files through this route.
uploadRoutes.use(authMiddleware);
uploadRoutes.post("/", upload.single("file"), uploadFile);
