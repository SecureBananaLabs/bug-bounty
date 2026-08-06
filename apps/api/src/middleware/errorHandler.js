import { ZodError } from "zod";
import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return fail(res, err.errors, 400);
  }
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";
  return fail(res, message, status);
}
