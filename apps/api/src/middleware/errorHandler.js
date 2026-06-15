import { ZodError } from "zod";
import Layer from "express/lib/router/layer.js";

const originalHandleRequest = Layer.prototype.handle_request;

if (!Layer.prototype.__asyncErrorForwardingPatched) {
  Layer.prototype.handle_request = function handleRequestWithAsyncErrors(req, res, next) {
    const fn = this.handle;

    if (fn.length > 3) {
      return next();
    }

    try {
      const result = fn(req, res, next);

      if (result && typeof result.catch === "function") {
        result.catch(next);
      }

      return result;
    } catch (err) {
      return next(err);
    }
  };

  Layer.prototype.__originalHandleRequest = originalHandleRequest;
  Layer.prototype.__asyncErrorForwardingPatched = true;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload",
      issues: err.issues
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
