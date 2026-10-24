import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  // A request without a file did not upload anything, so it must not be
  // reported as a successful 201 creation.
  if (!req.file) {
    return fail(res, "A file is required", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
