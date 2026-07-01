import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file uploaded", 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}mport { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  return ok(res, {
    filename: req.file?.originalname ?? null,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
}
