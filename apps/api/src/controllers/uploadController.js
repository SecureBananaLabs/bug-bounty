import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: "Empty or missing file submission" });
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
