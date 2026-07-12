import { ok } from "../utils/response.js";
import path from "path";

export async function uploadFile(req, res) {
  const raw = req.file?.originalname ?? null;
  const sanitized = raw ? path.basename(raw) : null;
  return ok(res, {
    filename: sanitized,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
