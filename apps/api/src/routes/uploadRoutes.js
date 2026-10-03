import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.route("/")
  .post(upload.single("file"), uploadFile)
  .all(methodNotAllowed(["POST"]));
