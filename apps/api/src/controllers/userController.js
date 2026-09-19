import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

function validateUserInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Request body must be a JSON object";
  }
  const maxFieldLength = 512;
  for (const [key, value] of Object.entries(payload)) {
    if (typeof key !== "string" || key.length > 64) {
      return `Invalid field name: "${key}"`;
    }
    if (typeof value === "string" && value.length > maxFieldLength) {
      return `Field "${key}" exceeds maximum length of ${maxFieldLength}`;
    }
  }
  return null;
}

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const error = validateUserInput(req.body);
  if (error) {
    return fail(res, error);
  }
  return ok(res, await createUser(req.body), 201);
}
