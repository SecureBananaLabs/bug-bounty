import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

// Uploads are buffered in memory, so every file needs a cap: without one a
// single request can grow the heap as large as the payload it carries.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

// multer reports an oversized payload through next(err); turn it into a plain
// 413 instead of letting the generic handler swallow it as a 500.
function uploadErrorHandler(error, req, res, next) {
	if (error?.code === "LIMIT_FILE_SIZE") {
		return fail(res, `File exceeds the ${MAX_UPLOAD_BYTES} byte limit`, 413);
	}
	return next(error);
}

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadErrorHandler, uploadFile);
