import { ok, fail } from "../utils/response.js";
import { createUserSchema } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    // Fix #1468: Validate input with Zod before passing to service layer
    const payload = createUserSchema.parse(req.body);
    const result = await createUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err.name === "ZodError") {
      // Fix #1469: Return 400 with structured validation errors
      return fail(res, {
        message: "Validation failed",
        errors: err.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      }, 400);
    }
    return fail(res, err.message || "User creation failed", 400);
  }
}
