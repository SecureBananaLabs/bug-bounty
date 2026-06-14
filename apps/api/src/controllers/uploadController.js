import { fail, ok } from "../utils/response.js";

const allowedFileTypes = new Map([
  ["application/pdf", [".pdf"]],
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["text/plain", [".txt"]]
]);

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  if (!isAllowedFileType(req.file)) {
    return fail(res, "Unsupported file type", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}

function isAllowedFileType(file) {
  const allowedExtensions = allowedFileTypes.get(file.mimetype);

  if (!allowedExtensions) {
    return false;
  }

  const lowerName = file.originalname.toLowerCase();
  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}
