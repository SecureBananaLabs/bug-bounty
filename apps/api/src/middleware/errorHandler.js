import { ZodError } from "zod";
import { fail } from "../utils/response.js";

function publicZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code
  }));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return fail(res, "Validation error", 400, publicZodIssues(err.issues));
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
