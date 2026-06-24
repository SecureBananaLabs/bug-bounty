import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../../utils/response.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile, (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return fail(res, "Uploaded file is too large", 413);
    }
    if (err.message && err.message.includes("Invalid file type")) {
      return fail(res, err.message, 400);
    }
    return fail(res, "File upload failed", 400);
  }
  next();
});
