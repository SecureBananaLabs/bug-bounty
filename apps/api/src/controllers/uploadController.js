import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ path: "file", code: "missing_file", message: "file is required" }]
    });
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
