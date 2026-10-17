import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return ok(res, { filename: null, status: "no-file" }, 400);
  }
  if (req.file.size === 0) {
    return ok(res, { filename: req.file.originalname, status: "empty-file-rejected" }, 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
