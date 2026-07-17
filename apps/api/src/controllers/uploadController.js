import { ok } from "../utils/response.js";
import path from "path";

export async function uploadFile(req, res) {
  let filename = req.file?.originalname ?? null;
  if (filename) {
    filename = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  return ok(res, {
    filename,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
