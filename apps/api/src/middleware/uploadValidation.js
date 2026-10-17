import multer from "multer";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain"
]);

export const maxUploadBytes = 5 * 1024 * 1024;

function fileFilter(req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error("Unsupported upload file type");
    error.statusCode = 400;
    return callback(error);
  }

  return callback(null, true);
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes
  },
  fileFilter
});
