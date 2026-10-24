import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";
import { ZodError } from "zod";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res, next) {
  try {
    const payload = createUserSchema.parse(req.body);
    const { password, ...safePayload } = payload;
    return ok(res, await createUser(safePayload), 201);
  } catch (err) {
    if (err instanceof ZodError || err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: err.issues
      });
    }
    if (next) return next(err);
    throw err;
  }
}
