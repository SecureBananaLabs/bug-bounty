import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), async (req, res) => { if (!req.file) { return res.status(400).json({ error: 'File is required' }); } uploadFile(req, res); });
