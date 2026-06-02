import { env } from "../config/env.js";

function toProductionLogPayload(err) {
  return {
    name: err?.name ?? "Error",
    status: err?.status ?? err?.statusCode ?? 500
  };
}

export function errorHandler(err, req, res, next) {
  const logPayload = env.nodeEnv === "production" ? toProductionLogPayload(err) : err;
  console.error("Unhandled API error:", logPayload);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
