import { ok } from "../utils/response.js";
import path from "path";

export async function uploadFile(req, res) {
  return ok(res, {
    filename: req.file?.originalname ? path.basename(req.file.originalname) : null,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
