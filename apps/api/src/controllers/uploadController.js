import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded. A valid file payload is required."
    });
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
