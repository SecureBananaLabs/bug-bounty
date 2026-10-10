const users = [];

const ALLOWED_FIELDS = ["name", "email", "role"];
const ALLOWED_ROLES = ["client", "freelancer"];
const DEFAULT_ROLE = "client";

function validateUserPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a non-empty object" };
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return { error: "name is required and must be a non-empty string" };
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) {
    return { error: "email is required and must be a non-empty string" };
  }

  // Only allow safe fields, strip forbidden ones like id
  const sanitized = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in payload && typeof payload[key] === "string") {
      sanitized[key] = payload[key].trim();
    }
  }

  // Ensure role is one of the allowed values, default to client
  if (!sanitized.role || !ALLOWED_ROLES.includes(sanitized.role)) {
    sanitized.role = DEFAULT_ROLE;
  }

  // Always set name and email from validated values
  sanitized.name = name;
  sanitized.email = email;

  return { user: sanitized };
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const result = validateUserPayload(payload);
  if (result.error) {
    return { __validationError: result.error };
  }

  const user = { id: `usr_${Date.now()}`, ...result.user };
  users.push(user);
  return user;
}
