import { ok, fail } from "../utils/response.js";
import path from "node:path";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  const sanitized = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");

  return ok(
    res,
    {
      filename: sanitized,
      size: req.file.size,
      mimetype: req.file.mimetype,
      status: "uploaded"
    },
    201
  );
}
