import { ok, fail } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (req.file?.mimetype === undefined) {
    return ok(res, {
      filename: null,
      status: "no-file"
    }, 201);
  }
  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
