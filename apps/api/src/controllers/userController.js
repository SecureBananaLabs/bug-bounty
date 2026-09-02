import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

const ALLOWED_ROLES = ["user", "admin", "moderator"];
const PUBLIC_ROLES = ["user", "moderator"];
const ALLOWED_FIELDS = ["name", "email", "role"];

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }

  const unknownFields = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (unknownFields.length > 0) {
    return res.status(400).json({ error: `Unknown field(s): ${unknownFields.join(", ")}` });
  }

  const { name, email, role } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Field 'name' is required and must be a non-empty string." });
  }

  if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
    return res.status(400).json({ error: "Field 'email' is required and must be a valid email address." });
  }

  const safeRole = role === undefined ? "user" : role;
  if (typeof safeRole !== "string" || !PUBLIC_ROLES.includes(safeRole)) {
    return res.status(400).json({ error: `Field 'role' must be one of: ${PUBLIC_ROLES.join(", ")}` });
  }

  const sanitizedPayload = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: safeRole,
  };

  return ok(res, await createUser(sanitizedPayload), 201);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
