import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return fail(res, "No file provided", 400);
    }
    next();
  });
}, uploadFile);
