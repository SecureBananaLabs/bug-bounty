import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

// memoryStorage() buffers the whole body in the Node heap, so the size has to
// be bounded up front instead of letting one request grow the heap arbitrarily.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

function uploadErrorHandler(error, req, res, next) {
	if (error?.code === "LIMIT_FILE_SIZE") {
		return fail(res, `File exceeds the ${MAX_UPLOAD_BYTES} byte limit`, 413);
	}

	return next(error);
}

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadErrorHandler, uploadFile);
