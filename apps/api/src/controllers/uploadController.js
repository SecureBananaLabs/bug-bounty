import { ok } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFile = asyncHandler(async (req, res) => {
  return ok(res, {
    filename: req.file?.originalname ?? null,
    status: req.file ? "uploaded" : "no-file"
  }, 201);
});
