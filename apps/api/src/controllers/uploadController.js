import path from "path";
import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  const safeName = path.basename(req.file.originalname || "").replace(/[^A-Za-z0-9._-]/g, "_");
  return ok(res, {
    filename: safeName,
    status: "uploaded"
  }, 201);
}
