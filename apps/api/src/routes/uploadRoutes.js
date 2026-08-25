import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.use("/", (req, res, next) => {
  if (req.method === "POST" && !req.is("multipart/form-data")) {
    return res.status(400).json({ error: "Request must be multipart/form-data" });
  }
  next();
});
uploadRoutes.post("/", upload.single("file"), uploadFile);
