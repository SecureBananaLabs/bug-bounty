import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Request body too large"
    });
  }

  if (err?.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof ZodError || err?.name === "ZodError" || Array.isArray(err?.issues)) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues ?? err.errors ?? []
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
