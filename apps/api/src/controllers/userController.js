import { ZodError } from "zod";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    const validated = createUserSchema.parse(req.body);
    return ok(res, await createUser(validated), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
}
