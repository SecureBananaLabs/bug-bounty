import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded",
    size: req.file.size
  }, 201);
}
