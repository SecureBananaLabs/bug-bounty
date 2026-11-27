import { ok } from "../utils/response.js";

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    return ok(res, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      status: "uploaded"
    }, 201);
  } catch (err) {
    next(err);
  }
}
