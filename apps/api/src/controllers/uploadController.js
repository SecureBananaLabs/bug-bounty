import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  return ok(res, {
    filename: req.file?.originalname ?? null,
    status: req.file ? "uploaded" : "no-file",
    uploaderId: req.user.sub
  }, 201);
}
