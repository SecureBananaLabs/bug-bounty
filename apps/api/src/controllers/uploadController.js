import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return ok(res, { status: "no-file" }, 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
