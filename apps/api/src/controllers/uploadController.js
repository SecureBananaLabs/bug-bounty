import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file provided"
    });
  }

  return ok(
    res,
    {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      status: "uploaded"
    },
    201
  );
}
