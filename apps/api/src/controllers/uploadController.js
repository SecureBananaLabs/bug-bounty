import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "File is required", 400);
  }

  return ok(
    res,
    {
      filename: req.file.originalname,
      size: req.file.size,
      status: "uploaded"
    },
    201
  );
}
